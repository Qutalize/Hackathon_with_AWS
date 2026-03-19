import json
import os
import boto3
import uuid
import base64
import re
import time
from datetime import datetime
from decimal import Decimal

# =========================================
# 環境変数の取得（Lambdaの「設定」画面の環境変数と合わせてください）
# =========================================
# BedrockのモデルID
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "jp.anthropic.claude-haiku-4-5-20251001-v1:0")
DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "function_2")
DYNAMODB_REGION = os.environ.get("AWS_REGION", "ap-northeast-1")
# Bedrock用に東京リージョン（ap-northeast-1）を明示的に指定
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "ap-northeast-1")

# =========================================
# クライアントの初期化
# =========================================
bedrock_client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
dynamodb = boto3.resource("dynamodb", region_name=DYNAMODB_REGION)

def pass_to_bedrock(event, context):
    try:
        # --- B. リクエストボディのパース ---
        body_str = event.get("body", "{}")
        # Function URL等でペイロード全体がBase64エンコードされている場合の考慮
        if event.get("isBase64Encoded"):
            body_str = base64.b64decode(body_str).decode('utf-8')
            
        body = json.loads(body_str)
        
        # フロントエンドから渡される「圧縮済み画像のBase64文字列リスト」と「在庫数」
        images_data = body.get("images", [])
        if not images_data and body.get("image"):
            # 後方互換性のため
            images_data = [body.get("image")]
            
        stock_quantity = body.get("stock", 0)
        if stock_quantity == "" or stock_quantity is None:
            stock_quantity = 0
        
        if not images_data or len(images_data) == 0:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "images (array of base64 strings) is required"})
            }

        content_blocks = []
        for img_data in images_data:
            image_format = "image/jpeg" # デフォルト
            if "," in img_data:
                header, base64_image = img_data.split(",", 1)
                # header = "data:image/png;base64" のような形式をパース
                if ":" in header and ";" in header:
                    image_format = header.split(":", 1)[1].split(";", 1)[0]
            else:
                base64_image = img_data
                
            content_blocks.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": image_format,
                    "data": base64_image
                }
            })

        # --- C. Bedrockで画像分析 ---
        # プロンプト（AIへの指示）
        prompt = """提供された1〜3枚の画像（すべて同一商品の異なる角度など）を同時に認識して、写っている商品の総合的な情報を正確に読み取ってください。
直ぐに回答を出すのではなく、時間をかけて正確に処理を行うため、以下のステップに必ず従ってください。

1. まず、必ずOCR機能を使用してすべての画像内に書かれているすべてのテキストを正確に読み取り、<ocr> タグ内に書き出してください。（※商品名がバーコードの近くに飛び地で離れて印字されていることも多いため、隅々まで注意深く確認してください）
2. 次に、読み取ったテキストや特徴を基に、商品の情報を特定するための推論プロセスを <thinking> タグ内に詳しく記述してください。
3. 最後に、以下のJSONフォーマット（キー名とデータ型は厳守）のみを <result> タグ内に出力してください。それ以外のテキストは <result> タグ内に含めないでください。

<result>
{
  "product_name": "商品の正式名称（例：しっとりチョコチップパン）",
  "category": "ジャンル（例：パン）",
  "expiration_date": "消費期限（YYYY/MM/DD形式。不明な場合は null）",
  "confidence_score": 確信度合い（0.0～1.0の数値）
}
</result>"""
        # プロンプトを最後に追加
        content_blocks.append({
            "type": "text",
            "text": prompt
        })

        # Claude 3 向けのペイロードフォーマット
        bedrock_payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": content_blocks
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
        raw_text = response_body.get("content", [])[0].get("text", "").strip()

        # <result> タグ内のテキストのみを抽出
        result_match = re.search(r"<result>\n*(.*?)\n*</result>", raw_text, re.DOTALL)
        if result_match:
            json_text = result_match.group(1).strip()
        else:
            json_text = raw_text.strip()

        # もし ```json ... ``` で囲まれてしまっている場合の保険
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        
        json_text = json_text.strip()
        
        # JSONとしてパーステスト（念のため）
        parsed_json = None
        try:
            parsed_json = json.loads(json_text)
            # 万が一フォーマットがずれていた場合の補正用だが、基本はそのままJSON文字列として利用
            analysis_result = json.dumps(parsed_json, ensure_ascii=False, indent=2)
        except json.JSONDecodeError:
            # JSONとしてパースできないエラーが起きた場合は、そのままテキストとして返す
            analysis_result = json_text

        # --- D. DynamoDBに保存 ---
        # フロントエンドから送信されたSSIDがあれば優先し、なければ自動生成する
        frontend_ssid = body.get("ssid")
        if frontend_ssid:
            try:
                item_id = int(frontend_ssid)
            except ValueError:
                item_id = int(time.time() * 1000)
        else:
            item_id = int(time.time() * 1000)
            
        timestamp = datetime.now().isoformat()
        
        table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        
        # 保存するベースのアイテム
        item = {
            "SSID": item_id,
            "stock_quantity": Decimal(str(stock_quantity)),
            "created_at": timestamp
        }
        
        # JSONが正しく取得できていれば各項目を個別のカラムとして保存する
        if parsed_json:
            item["product_name"] = parsed_json.get("product_name", "")
            item["category"] = parsed_json.get("category", "")
            
            exp_date = parsed_json.get("expiration_date")
            if exp_date:
                item["expiration_date"] = exp_date
                
            conf = parsed_json.get("confidence_score")
            if conf is not None:
                item["confidence_score"] = Decimal(str(conf))
        else:
            # パース 실패した場合は文字列ごと雑に保存
            item["raw_analysis"] = analysis_result
            
        table.put_item(Item=item)

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
