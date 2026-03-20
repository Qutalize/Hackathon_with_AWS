import json
import os
from datetime import datetime
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# 1. 環境変数の取得（Lambdaの「設定」画面のキー名と合わせてください）
BUCKET_NAME = os.environ.get("BUCKET_NAME")
REGION = os.environ.get("AWS_REGION", "ap-northeast-1")

# 2. S3クライアントの設定（署名バージョンv4を明示するのが403回避のコツ）
s3_client = boto3.client(
    "s3",
    region_name=REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)

# 3. CORSヘッダーの定義
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

def give_URL(event, context):
    # --- A. プリフライト（OPTIONS）リクエストへの即答 ---
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": ""
        }

    try:
        # --- B. リクエストボディの解析 ---
        body = json.loads(event.get("body") or "{}")
        file_name = body.get("fileName")
        file_type = body.get("fileType") # 例: image/jpeg

        # 必須パラメータのチェック
        if not file_name or not file_type:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "fileName and fileType are required"}),
            }

        # --- C. S3上の保存パス（キー）の生成 ---
        # 20260319123456-filename.jpg のような形式
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        key = f"uploads/{timestamp}-{file_name}"

        # --- D. 署名付きURL（Pre-signed URL）の生成 ---
        # ⚠️ Paramsの中に ContentType を含めるのが403エラー解決の鍵です！
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": file_type, 
            },
            ExpiresIn=300, # 5分間有効
        )

        # 最終的な画像の公開URL（アップロード後の確認用）
        s3_url = f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{key}"

        # --- E. 成功レスポンスの返却 ---
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "presignedUrl": presigned_url,
                "url": s3_url,
                "key": key,
            }),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }