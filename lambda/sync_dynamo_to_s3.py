import json
import boto3
import os
import decimal
from datetime import datetime, timedelta, timezone
from boto3.dynamodb.types import TypeDeserializer

# ターゲットバケット（環境変数があれば優先、なければ直書きされたものを利用）
TARGET_BUCKET = os.environ.get("TARGET_BUCKET", "all-918375630428-ap-northeast-1-an")
s3 = boto3.client('s3')

class DecimalEncoder(json.JSONEncoder):
    """DynamoDBのNumber型（Decimal）を通常のint/floatとしてJSONに変換するためのエンコーダー"""
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def deserialize_dynamodb_item(image):
    """DynamoDBの固有の型 {"S": "文字列", "N": "数字"} をPython標準の辞書に変換する"""
    deserializer = TypeDeserializer()
    return {k: deserializer.deserialize(v) for k, v in image.items()}

def sync_dynamo_to_s3(event, context):
    try:
        # 1. KST/JSTタイムゾーンを準備 (+9時間)
        JST = timezone(timedelta(hours=+9), 'JST')
        # Hiveパーティション形式用の日付情報を取得
        now_jst = datetime.now(JST)
        year_str = now_jst.strftime('%Y')
        month_str = now_jst.strftime('%m')
        day_str = now_jst.strftime('%d')
        
        # 2. DynamoDB Streamsから複数流れてくるイベントレコードの処理
        for record in event.get('Records', []):
            event_name = record['eventName']
            
            # 要件: INSERT（新規作成）および MODIFY（更新）の時のみS3へ書き込む
            if event_name not in ['INSERT', 'MODIFY']:
                continue
                
            # DynamoDBデータの取り出し
            new_image = record['dynamodb'].get('NewImage', {})
            if not new_image:
                continue
                
            # 型を通常のPython辞書に直す
            parsed_item = deserialize_dynamodb_item(new_image)
            
            # SSIDの取得
            ssid = str(parsed_item.get('SSID', int(now_jst.timestamp() * 1000)))
            
            # Hiveパーティション形式のS3キーを作成 (Athena等のクエリに最適化)
            s3_key = f"raw/function2/year={year_str}/month={month_str}/day={day_str}/{ssid}.json"
            
            # JSON文字列に変換 (日本語文字化け防止のために ensure_ascii=False)
            json_body = json.dumps(parsed_item, cls=DecimalEncoder, ensure_ascii=False, indent=2)
            
            # S3にJSONファイルを保存
            s3.put_object(
                Bucket=TARGET_BUCKET,
                Key=s3_key,
                Body=json_body.encode('utf-8'),
                ContentType='application/json'
            )
            print(f"[{event_name}] Successfully uploaded item to s3://{TARGET_BUCKET}/{s3_key}")
            
        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed records.')
        }
        
    except Exception as e:
        print(f"Error processing dynamo stream: {str(e)}")
        raise e
