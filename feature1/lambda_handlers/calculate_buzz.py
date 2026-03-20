"""
Lambda② ハンドラー: バズ度計算 + AWS SNS通知 + S3保存
DynamoDB Streams から自動トリガーされる。

処理フロー:
1. DynamoDB Streams のイベントから新規INSERTされた投稿データを取得
2. バズ度（バイラルスコア）を計算
3. 推奨発注量を算出
4. AWS SNS で担当者に在庫増加推奨を通知
5. 「商品名・ジャンル・在庫増加予測」をS3データレイクに直接保存
"""
import json
import logging
import math
import sys
import os
from datetime import datetime, timezone
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from utils.dynamo_client import DynamoClient
from utils.notification import NotificationClient
from utils.s3_client import S3Client

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def calculate_buzz_score(post: dict, config: type = Config) -> float:
    """
    バズ度（0〜100）を計算する。

    バズ度 = 重み付き合計スコア
      - いいね数（対数正規化） × BUZZ_WEIGHT_LIKES
      - コメント数（対数正規化） × BUZZ_WEIGHT_COMMENTS
      - シェア数（対数正規化） × BUZZ_WEIGHT_SHARES
      - 感情ポジティブ度        × BUZZ_WEIGHT_SENTIMENT
    """
    likes = _log_normalize(post.get("likes", 0), max_val=50000)
    comments = _log_normalize(post.get("comments", 0), max_val=5000)
    shares = _log_normalize(post.get("shares", 0), max_val=10000)
    sentiment_positive = float(post.get("sentiment_positive", 0.5))

    raw_score = (
        likes * config.BUZZ_WEIGHT_LIKES
        + comments * config.BUZZ_WEIGHT_COMMENTS
        + shares * config.BUZZ_WEIGHT_SHARES
        + sentiment_positive * config.BUZZ_WEIGHT_SENTIMENT
    )

    buzz_score = min(raw_score * 100, 100.0)
    return round(buzz_score, 1)


def calculate_recommended_quantity(
    buzz_score: float, config: type = Config
) -> int:
    """
    バズ度から推奨発注量を計算する。
    推奨量 = BASE_ORDER_QUANTITY × (1 + buzz_score/100 × BUZZ_MULTIPLIER)
    """
    multiplier = 1 + (buzz_score / 100) * config.BUZZ_MULTIPLIER
    quantity = int(config.BASE_ORDER_QUANTITY * multiplier)
    return max(quantity, config.BASE_ORDER_QUANTITY)


def _log_normalize(value: float, max_val: float = 10000) -> float:
    """対数スケールで 0〜1 に正規化"""
    if value <= 0:
        return 0.0
    return min(math.log1p(value) / math.log1p(max_val), 1.0)


def _parse_dynamodb_stream_records(event: dict) -> list[dict]:
    """
    DynamoDB Streams のイベントからフラットな投稿データに変換する。
    INSERT イベントのみを処理し、MODIFY は無視する（無限ループ防止）。
    また、既にバズ度計算済み（step2_processed=True）のデータもスキップする。
    """
    posts = []
    for record in event.get("Records", []):
        event_name = record.get("eventName", "")

        # INSERT のみ処理（Lambda②自身のMODIFYによる再発火を防止）
        if event_name != "INSERT":
            continue

        new_image = record.get("dynamodb", {}).get("NewImage", {})
        if not new_image:
            continue

        # DynamoDB の型付きJSON → フラットなdict に変換
        flat = {}
        for key, value_dict in new_image.items():
            flat[key] = _parse_dynamodb_value(value_dict)

        # 既にバズ度計算済みならスキップ（二重処理防止）
        if flat.get("step2_processed"):
            continue

        posts.append(flat)

    return posts


def _parse_dynamodb_value(value_dict: dict):
    """DynamoDB の型情報を解析して通常の値に変換"""
    if "S" in value_dict:
        return value_dict["S"]
    elif "N" in value_dict:
        num = value_dict["N"]
        return float(num) if "." in num else int(num)
    elif "BOOL" in value_dict:
        return value_dict["BOOL"]
    elif "NULL" in value_dict:
        return None
    elif "L" in value_dict:
        return [_parse_dynamodb_value(v) for v in value_dict["L"]]
    elif "M" in value_dict:
        return {k: _parse_dynamodb_value(v) for k, v in value_dict["M"].items()}
    else:
        return str(value_dict)


def handler(event, context):
    """
    Lambda② ハンドラー: バズ度計算 + AWS SNS通知

    トリガー:
      - DynamoDB Streams（本番）: Lambda①がDynamoDBに保存 → 自動発火
      - 直接呼び出し（テスト）: event["posts"] にデータを渡す
    """
    logger.info("📥 Lambda② 開始: バズ度計算 + 通知")

    try:
        # ===== 1. 投稿データ取得 =====
        # DynamoDB Streams からの場合と、直接呼び出しの場合の両方に対応
        if "Records" in event:
            # DynamoDB Streams からのトリガー（本番）
            posts = _parse_dynamodb_stream_records(event)
            logger.info(f"📡 DynamoDB Streams から {len(posts)} 件の新規INSERTを検出")
        elif "posts" in event:
            # 直接呼び出し（テスト/デモモード）
            posts = event.get("posts", [])
            logger.info(f"📋 直接呼び出しで {len(posts)} 件のデータを受信")
        else:
            # DynamoDB から全件取得（フォールバック）
            dynamo = DynamoClient(
                table_name=Config.DYNAMODB_TABLE_NAME,
                region=Config.AWS_REGION,
                demo_mode=Config.DEMO_MODE,
            )
            posts = dynamo.get_all_posts()
            logger.info(f"📦 DynamoDB から {len(posts)} 件のデータを取得")

        if not posts:
            logger.info("処理対象データなし（INSERT以外 or 処理済み）")
            return _response(200, {"message": "処理対象データなし", "count": 0})

        # ===== 2. バズ度計算 + DynamoDB更新 =====
        dynamo = DynamoClient(
            table_name=Config.DYNAMODB_TABLE_NAME,
            region=Config.AWS_REGION,
            demo_mode=Config.DEMO_MODE,
        )

        results = []
        for post in posts:
            buzz_score = calculate_buzz_score(post)
            recommended_qty = calculate_recommended_quantity(buzz_score)

            update = {
                "buzz_score": buzz_score,
                "recommended_quantity": recommended_qty,
                "step2_processed": True,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }

            # DynamoDB を更新
            # ※ この MODIFY イベントは handler 冒頭で INSERT のみフィルタしているため
            #   無限ループにはならない
            post_id = post.get("post_id", "")
            dynamo.update_post(post_id, update)

            merged = {**post, **update}
            results.append(merged)

            logger.info(
                f"  🔥 {post.get('product_name', '不明')}: "
                f"バズ度={buzz_score}, 推奨量=+{recommended_qty}"
            )

        # バズ度でソート（降順）
        results.sort(key=lambda x: x.get("buzz_score", 0), reverse=True)

        # バズ度20以上の商品を推奨対象に
        top_products = [
            {
                "product_name": r.get("product_name", "不明"),
                "genre": r.get("genre", "その他"),
                "store": r.get("store", "不明"),
                "buzz_score": r["buzz_score"],
                "recommended_quantity": r["recommended_quantity"],
                "reason": _generate_reason(r),
            }
            for r in results
            if r.get("buzz_score", 0) >= 20
        ]

        # ===== 3. AWS SNS で担当者に通知 =====
        notifier = NotificationClient(
            topic_arn=Config.SNS_TOPIC_ARN,
            region=Config.AWS_REGION,
            demo_mode=Config.DEMO_MODE,
        )

        message_id = None
        if top_products:
            message_id = notifier.send_restock_notification(top_products)
            logger.info(f"📢 {len(top_products)} 件の在庫増加推奨を通知しました")
        else:
            logger.info("📢 推奨商品なし（バズ度しきい値未満）")

        # ===== 4. S3 に直接保存（商品名・ジャンル・在庫増加予測の3列）=====
        s3 = S3Client(
            bucket_name=Config.S3_BUCKET_NAME,
            prefix=Config.S3_PREFIX,
            region=Config.AWS_REGION,
            demo_mode=Config.DEMO_MODE,
        )
        s3_records = [
            {
                "商品名": r.get("product_name", ""),
                "ジャンル": r.get("genre", ""),
                "在庫増加予測": r.get("recommended_quantity", 0),
            }
            for r in results
        ]
        if s3_records:
            s3_path = s3.upload_learning_data(s3_records)
            logger.info(f"📦 S3保存完了: {s3_path}")

        result = {
            "message": "Lambda② 完了",
            "processed_count": len(results),
            "recommended_count": len(top_products),
            "notification_sent": message_id is not None or Config.DEMO_MODE,
            "notification_message_id": message_id,
            "top_products": top_products,
        }

        logger.info(f"✅ Lambda② 完了: {len(results)}件処理, {len(top_products)}件推奨")
        return _response(200, result)

    except Exception as e:
        logger.error(f"❌ Lambda② エラー: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


def _generate_reason(result: dict) -> str:
    """推奨理由を生成する"""
    parts = []
    sentiment = result.get("sentiment", "NEUTRAL")
    likes = result.get("likes", 0)
    platform = result.get("platform", "")

    if sentiment == "POSITIVE":
        parts.append("SNSで好意的な反応が多い")
    if likes > 5000:
        parts.append(f"いいね数 {likes:,} で高い注目度")
    elif likes > 1000:
        parts.append(f"いいね数 {likes:,} で注目されている")
    if platform:
        parts.append(f"{platform}でバズ中")

    return "。".join(parts) if parts else "SNSで話題"


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


# ローカル実行用
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    from utils.sns_clients import SAMPLE_POSTS
    from utils.llm_client import LLMClient

    llm = LLMClient(demo_mode=True)
    posts_with_analysis = []
    for post in SAMPLE_POSTS:
        analysis = llm.analyze(post["text"])
        enriched = {**post, **{
            "sentiment": analysis["sentiment"],
            "sentiment_positive": analysis["sentiment_scores"]["positive"],
            "product_name": analysis["product_name"],
            "genre": analysis["genre"],
            "store": analysis["store"],
        }}
        posts_with_analysis.append(enriched)

    result = handler({"posts": posts_with_analysis}, None)
    parsed = json.loads(result["body"])
    print(json.dumps(parsed, ensure_ascii=False, indent=2))
