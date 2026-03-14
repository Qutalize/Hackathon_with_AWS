"""
機能① 設定管理モジュール
環境変数から各APIキー・AWSリソース名を取得する。
"""
import os


class Config:
    """環境変数ベースの設定クラス"""

    # --- 動作モード ---
    # True にするとAPIを呼ばずサンプルデータで動作（デモ用）
    DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true"

    # --- SNS API キー ---
    YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
    TWITTER_BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN", "")
    INSTAGRAM_ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    INSTAGRAM_BUSINESS_ACCOUNT_ID = os.environ.get("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")

    # --- 生成AI API（将来 Bedrock に切替予定） ---
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

    # --- AWS リソース ---
    AWS_REGION = os.environ.get("AWS_REGION", "ap-northeast-1")
    DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "feature1_sns_data")
    S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "feature1-data-lake")
    S3_PREFIX = os.environ.get("S3_PREFIX", "feature1/raw/")
    SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")

    # --- 検索パラメータ ---
    SEARCH_TAGS = os.environ.get(
        "SEARCH_TAGS",
        "コンビニ新商品,コンビニスイーツ,コンビニ限定,セブンイレブン,ファミマ,ローソン,コンビニグルメ"
    ).split(",")

    MAX_RESULTS_PER_PLATFORM = int(os.environ.get("MAX_RESULTS_PER_PLATFORM", "50"))

    # --- バズ度計算パラメータ ---
    BUZZ_WEIGHT_LIKES = float(os.environ.get("BUZZ_WEIGHT_LIKES", "0.3"))
    BUZZ_WEIGHT_COMMENTS = float(os.environ.get("BUZZ_WEIGHT_COMMENTS", "0.2"))
    BUZZ_WEIGHT_SHARES = float(os.environ.get("BUZZ_WEIGHT_SHARES", "0.2"))
    BUZZ_WEIGHT_SENTIMENT = float(os.environ.get("BUZZ_WEIGHT_SENTIMENT", "0.3"))

    # --- 発注量計算 ---
    BASE_ORDER_QUANTITY = int(os.environ.get("BASE_ORDER_QUANTITY", "10"))
    BUZZ_MULTIPLIER = float(os.environ.get("BUZZ_MULTIPLIER", "1.5"))
