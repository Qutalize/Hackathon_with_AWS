"""
全パイプライン統合テスト（ローカル実行用）
Lambda① → Lambda② をデモモードで一気通貫実行する。
APIキー不要でサンプルデータを使って動作確認できる。

※ DynamoDB Streams → Firehose → S3 はAWS上で自動動作するため、
  デモモードでは S3 保存をローカルファイルで代替する。

使い方:
  cd feature1
  python run_pipeline.py
"""
import json
import logging
import os
import sys

# 強制的にデモモードを有効化
os.environ["DEMO_MODE"] = "true"

# パス設定
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lambda_handlers.collect_sns_data import handler as lambda1_handler
from lambda_handlers.calculate_buzz import handler as lambda2_handler
from utils.s3_client import S3Client
from config import Config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


def main():
    print("=" * 70)
    print("🚀 機能① パイプライン全体テスト（デモモード）")
    print("=" * 70)
    print()
    print("📐 新アーキテクチャ:")
    print("  EventBridge → Lambda①(収集+Gemini) → DynamoDB")
    print("  DynamoDB → Lambda②(バズ度+通知) → AWS SNS")
    print("  DynamoDB → Streams → Firehose → S3 (自動)")
    print()

    # ============================
    # Lambda①: SNSデータ収集 + 生成AI分析
    # ============================
    print("─" * 70)
    print("📥 Lambda①: SNSデータ収集 + 生成AI(Gemini)分析")
    print("─" * 70)

    lambda1_result = lambda1_handler({}, None)
    lambda1_body = json.loads(lambda1_result["body"])

    print(f"  ✅ 収集件数: {lambda1_body.get('collected_count', 0)}")
    print(f"  ✅ 分析件数: {lambda1_body.get('analyzed_count', 0)}")
    print(f"  ✅ 保存件数: {lambda1_body.get('saved_count', 0)}")
    print(f"  ✅ プラットフォーム: {lambda1_body.get('platforms', [])}")
    print(f"  ✅ 感情分析: {lambda1_body.get('sentiment_summary', {})}")
    print(f"  ✅ 分析エンジン: Gemini (将来Bedrockに切替)")

    # ============================
    # Lambda②: バズ度計算 + AWS SNS通知
    # ============================
    print()
    print("─" * 70)
    print("🔥 Lambda②: バズ度計算 + AWS SNS通知")
    print("─" * 70)

    # Lambda① の出力をLambda② に渡す
    posts = lambda1_body.get("posts", [])
    lambda2_result = lambda2_handler({"posts": posts}, None)
    lambda2_body = json.loads(lambda2_result["body"])

    print(f"  ✅ 処理件数: {lambda2_body.get('processed_count', 0)}")
    print(f"  ✅ 推奨商品数: {lambda2_body.get('recommended_count', 0)}")
    print(f"  ✅ 通知送信: {lambda2_body.get('notification_sent', False)}")
    print()

    top_products = lambda2_body.get("top_products", [])
    if top_products:
        print("  📊 推奨商品ランキング:")
        print("  " + "─" * 55)
        for i, p in enumerate(top_products[:10], 1):
            print(
                f"  {i:2d}. 🔥{p['buzz_score']:5.1f}  "
                f"{p['product_name']:<20s}  "
                f"({p['store']})  "
                f"+{p['recommended_quantity']}個"
            )
        print("  " + "─" * 55)

    # ============================
    # S3 デモ保存（Firehose代替）
    # ============================
    print()
    print("─" * 70)
    print("📦 S3 デモ保存（本番では DynamoDB Streams → Firehose → S3 で自動）")
    print("─" * 70)

    s3 = S3Client(
        bucket_name=Config.S3_BUCKET_NAME,
        prefix=Config.S3_PREFIX,
        demo_mode=True,
    )

    learning_records = []
    for post in posts:
        learning_records.append({
            "product_name": post.get("product_name", "不明"),
            "genre": post.get("genre", "その他"),
            "store": post.get("store", "不明"),
            "buzz_score": post.get("buzz_score", 0),
            "recommended_quantity": post.get("recommended_quantity", 0),
            "likes": post.get("likes", 0),
            "comments": post.get("comments", 0),
            "sentiment": post.get("sentiment", "NEUTRAL"),
            "platform": post.get("platform", ""),
            "source": "feature1_sns_pipeline",
        })

    if learning_records:
        data_path = s3.upload_learning_data(learning_records)
        print(f"  ✅ 学習データ保存先: {data_path}")

    # ============================
    # 完了
    # ============================
    print()
    print("=" * 70)
    print("🎉 パイプライン全体テスト完了！")
    print("=" * 70)

    if os.path.exists("demo_output"):
        print()
        print("📂 生成されたファイル:")
        for root, dirs, files in os.walk("demo_output"):
            for f in files:
                filepath = os.path.join(root, f)
                size = os.path.getsize(filepath)
                print(f"  📄 {filepath} ({size} bytes)")


if __name__ == "__main__":
    main()
