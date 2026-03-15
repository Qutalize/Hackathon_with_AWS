import json
import boto3
import base64
import os
from datetime import datetime

s3 = boto3.client("s3")
BUCKET_NAME = "function2-261414899271-ap-northeast-1-an"


def lambda_handler(event, context):
    # OPTIONSプリフライトリクエストの処理
    if event.get("httpMethod") == "OPTIONS":
        return response(200, {})

    try:
        body = json.loads(event.get("body", "{}"))

        file_name = body.get("fileName")
        file_type = body.get("fileType")
        file_data = body.get("fileData")

        if not file_name or not file_type or not file_data:
            return response(400, {"message": "fileName, fileType, fileData は必須です"})

        # ファイル名にタイムスタンプを付与して重複回避
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        s3_key = f"uploads/{timestamp}_{file_name}"

        image_data = base64.b64decode(file_data)

        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=image_data,
            ContentType=file_type,
        )

        return response(200, {
            "message": "アップロード成功",
            "key": s3_key,
        })

    except Exception as e:
        return response(500, {"message": f"サーバーエラー: {str(e)}"})


def response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }
