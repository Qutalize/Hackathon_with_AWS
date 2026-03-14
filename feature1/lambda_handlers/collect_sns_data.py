"""
Lambda① ハンドラー: SNSデータ収集 + 生成AI分析
EventBridge から定期実行される。

新アーキテクチャ:
  EventBridge → Lambda①(収集+Gemini分析) → DynamoDB → Streams → Firehose → S3

処理フロー:
1. SNS (YouTube, X, Instagram) からデータ収集
2. Gemini API で感情分析 + 商品名抽出（Bedrock代替）
3. 結果を DynamoDB に保存（→ Streams → Firehose → S3 は自動）
"""
import json
import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from utils.sns_clients import SNSCollector
from utils.llm_client import LLMClient
from utils.dynamo_client import DynamoClient

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    Lambda① ハンドラー: SNSデータ収集 + Gemini感情分析・商品名抽出

    EventBridge ルールから定期実行（例: 毎日 6:00 JST）
    """
    logger.info("📥 Lambda① 開始: SNSデータ収集 + 生成AI分析")
    logger.info(f"  デモモード: {Config.DEMO_MODE}")
    logger.info(f"  検索タグ: {Config.SEARCH_TAGS}")

    try:
        # ===== 1. SNSデータ収集 =====
        collector = SNSCollector(Config)
        posts = collector.collect_all()
        logger.info(f"📊 {len(posts)} 件の投稿を収集しました")

        if not posts:
            return _response(200, {"message": "収集データなし", "count": 0})

        # ===== 2. Gemini で感情分析 + 商品名抽出 =====
        # ※ 将来的にここを Bedrock に置き換え
        llm = LLMClient(
            api_key=Config.GEMINI_API_KEY,
            demo_mode=Config.DEMO_MODE,
        )

        analyzed_posts = []
        for post in posts:
            # 感情分析 + 商品名抽出を1回のAPI呼び出しで実行
            analysis = llm.analyze(post["text"])

            # 分析結果をマージ
            enriched_post = {
                **post,
                # 感情分析（旧Comprehend/将来Bedrock）
                "sentiment": analysis["sentiment"],
                "sentiment_positive": analysis["sentiment_scores"].get("positive", 0),
                "sentiment_negative": analysis["sentiment_scores"].get("negative", 0),
                "sentiment_neutral": analysis["sentiment_scores"].get("neutral", 0),
                # 商品名抽出（旧LLM単独/将来Bedrock）
                "product_name": analysis["product_name"],
                "genre": analysis["genre"],
                "store": analysis["store"],
                "product_confidence": analysis["product_confidence"],
                # メタデータ
                "analyzed_by": "gemini",  # 将来 "bedrock" に切替
            }
            analyzed_posts.append(enriched_post)

            logger.info(
                f"  🔍 [{analysis['sentiment']}] "
                f"{analysis['product_name']} ({analysis['store']}) "
                f"pos={analysis['sentiment_scores'].get('positive', 0):.2f}"
            )

        logger.info("✅ 生成AI分析完了")

        # ===== 3. DynamoDB に保存 =====
        # → DynamoDB Streams → Data Firehose → S3 は自動で流れる
        dynamo = DynamoClient(
            table_name=Config.DYNAMODB_TABLE_NAME,
            region=Config.AWS_REGION,
            demo_mode=Config.DEMO_MODE,
        )
        saved_count = dynamo.save_posts_batch(analyzed_posts)

        # 集計
        sentiment_summary = {}
        for post in analyzed_posts:
            s = post.get("sentiment", "NEUTRAL")
            sentiment_summary[s] = sentiment_summary.get(s, 0) + 1

        result = {
            "message": "Lambda① 完了",
            "collected_count": len(posts),
            "analyzed_count": len(analyzed_posts),
            "saved_count": saved_count,
            "platforms": list(set(p["platform"] for p in posts)),
            "sentiment_summary": sentiment_summary,
            # Lambda② に渡すデータ
            "posts": analyzed_posts,
        }

        logger.info(f"✅ Lambda① 完了: {json.dumps({k: v for k, v in result.items() if k != 'posts'}, ensure_ascii=False)}")
        return _response(200, result)

    except Exception as e:
        logger.error(f"❌ Lambda① エラー: {str(e)}", exc_info=True)
        return _response(500, {"error": str(e)})


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
    result = handler({}, None)
    body = json.loads(result["body"])
    # postsは大きいので除外して表示
    display = {k: v for k, v in body.items() if k != "posts"}
    print(json.dumps(display, ensure_ascii=False, indent=2))
