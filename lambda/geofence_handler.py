import json
import boto3
import os
from datetime import datetime, timedelta, timezone

# 環境変数
PRESENCE_TABLE = os.environ.get("PRESENCE_TABLE", "Presence")
# Presenceの有効期限（秒）: デフォルト2時間
PRESENCE_TTL_SECONDS = int(os.environ.get("PRESENCE_TTL_SECONDS", 7200))

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-northeast-1"))

def geofence_handler(event, context):
    """
    Amazon Location Service の Geofence イベントを受け取り、
    Presence テーブルに「今この店舗の近くにいる」情報を保存する。

    EventBridge 経由で届くイベント構造:
    {
      "detail-type": "Location Geofence Event",
      "detail": {
        "EventType": "ENTER" or "EXIT",
        "GeofenceId": "store_001",         ← 店舗ID
        "DeviceId": "device_abc123",       ← デバイスID
        "SampleTime": "2026-03-20T10:00:00Z"
      }
    }
    """
    print(f"Received event: {json.dumps(event)}")

    detail = event.get("detail", {})
    event_type = detail.get("EventType")
    store_id = detail.get("GeofenceId")
    device_id = detail.get("DeviceId")

    if not store_id or not device_id:
        print("Missing GeofenceId or DeviceId.")
        return {"statusCode": 400, "body": "Missing required fields."}

    table = dynamodb.Table(PRESENCE_TABLE)

    if event_type == "ENTER":
        # TTL: 現在時刻 + PRESENCE_TTL_SECONDS 後に自動削除
        now = datetime.now(timezone.utc)
        ttl = int((now + timedelta(seconds=PRESENCE_TTL_SECONDS)).timestamp())

        table.put_item(Item={
            "store_id": store_id,
            "device_id": device_id,
            "entered_at": now.isoformat(),
            "ttl": ttl  # DynamoDB TTL で自動削除
        })
        print(f"[ENTER] store={store_id}, device={device_id}")

    elif event_type == "EXIT":
        # 店を出たら即削除
        table.delete_item(Key={
            "store_id": store_id,
            "device_id": device_id
        })
        print(f"[EXIT] store={store_id}, device={device_id}")

    return {"statusCode": 200, "body": "OK"}
