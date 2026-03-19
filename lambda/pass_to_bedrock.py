import json
import os
import boto3
import uuid
import base64
from datetime import datetime

# =========================================
# 環境変数の取得（Lambdaの「設定」画面の環境変数と合わせてください）
# =========================================
# BedrockのモデルID (例: anthropic.claude-3-haiku-20240307-v1:0)
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "InventoryTable")
REGION = os.environ.get("AWS_REGION", "ap-northeast-1")

# =========================================
# クライアントの初期化
# =========================================
bedrock_client = boto3.client("bedrock-runtime", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)

def pass_to_bedrock(event, context):
    try:
        # --- B. リクエストボディのパース ---
        body_str = event.get("body", "{}")
        # Function URL等でペイロード全体がBase64エンコードされている場合の考慮
        if event.get("isBase64Encoded"):
            body_str = base64.b64decode(body_str).decode('utf-8')
            
        body = json.loads(body_str)
        
        # フロントエンドから渡される「圧縮済み画像のBase64文字列」と「在庫数」
        image_data = body.get("image") 
        stock_quantity = body.get("stock", 0)
        
        if not image_data:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "image (base64 string) is required"})
            }

        # Data URIプレフィックス ("data:image/jpeg;base64,...") がある場合は削除しつつフォーマットを特定
        image_format = "image/jpeg" # デフォルト
        if "," in image_data:
            header, base64_image = image_data.split(",", 1)
            # header = "data:image/png;base64" のような形式をパース
            if ":" in header and ";" in header:
                image_format = header.split(":", 1)[1].split(";", 1)[0]
        else:
            base64_image = image_data

        # --- C. Bedrockで画像分析 ---
        # プロンプト（AIへの指示）
        prompt = "この画像に写っている商品の名前、カテゴリ、特徴、もしわかれば賞味期限・消費期限などを具体的に分析してください。"
        
        # Claude 3 向けのペイロードフォーマット
        bedrock_payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": image_format,
                                "data": base64_image
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }

        # Bedrockの呼び出し
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(bedrock_payload),
            contentType="application/json",
            accept="application/json"
        )
        
        # レスポンスの解析
        response_body = json.loads(response.get("body").read())
        analysis_result = response_body.get("content", [])[0].get("text", "")

        # --- D. DynamoDBに保存（※DB未実装のため一時的にコメントアウト） ---
        item_id = str(uuid.uuid4())
        
        # table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        # timestamp = datetime.now().isoformat()
        # item = {
        #     "id": item_id,
        #     "stock_quantity": int(stock_quantity),
        #     "analysis_result": analysis_result,
        #     "created_at": timestamp
        # }
        # table.put_item(Item=item)

        # --- E. フロントエンドへ成功レスポンスを返却 ---
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Analysis and storage successful",
                "id": item_id,
                "analysis_result": analysis_result,
                "stock": int(stock_quantity)
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
