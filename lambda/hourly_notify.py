import json
import boto3
import os
import urllib.request
from datetime import datetime, timedelta, timezone
from decimal import Decimal

# 環境変数
STORE_STOCK_TABLE = os.environ.get("STORE_STOCK_TABLE", "StoreStock")
PRESENCE_TABLE    = os.environ.get("PRESENCE_TABLE", "Presence")
USER_MAP_TABLE    = os.environ.get("USER_MAP_TABLE", "UserMap")
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")
THRESHOLD_DAYS    = int(os.environ.get("THRESHOLD_DAYS", 3))

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-northeast-1"))

def get_expiring_items_by_store():
    """
    Lambda A: StoreStock テーブルから期限間近な商品を店舗ごとに取得。
    返り値: { store_id: [{ product_name, expiration_date, days_remaining, stock }, ...] }
    """
    table = dynamodb.Table(STORE_STOCK_TABLE)
    response = table.scan()
    items = response.get("Items", [])
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    JST = timezone(timedelta(hours=+9), "JST")
    today = datetime.now(JST).date()

    result = {}
    for item in items:
        exp_str = item.get("expiration_date")
        stock = int(item.get("stock_quantity", 0))
        if not exp_str or stock <= 0:
            continue
        try:
            exp_date = datetime.strptime(exp_str, "%Y/%m/%d").date()
        except ValueError:
            continue

        days_remaining = (exp_date - today).days
        if days_remaining > THRESHOLD_DAYS:
            continue

        store_id = item.get("store_id", "unknown")
        result.setdefault(store_id, []).append({
            "product_name":    item.get("product_name", "不明な商品"),
            "expiration_date": exp_str,
            "days_remaining":  days_remaining,
            "stock":           stock
        })

    return result

def get_devices_near_store(store_id):
    """
    Lambda B: Presence テーブルから、指定店舗に今いる DeviceID 一覧を取得。
    """
    table = dynamodb.Table(PRESENCE_TABLE)
    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key("store_id").eq(store_id)
    )
    return [item["device_id"] for item in response.get("Items", [])]

def get_discord_ids(device_ids):
    """
    Lambda C (前半): UserMap テーブルから DeviceID → Discord ID のマッピングを取得。
    返り値: [discord_id, ...]（重複なし）
    """
    if not device_ids:
        return []

    table = dynamodb.Table(USER_MAP_TABLE)
    discord_ids = set()
    for device_id in device_ids:
        response = table.get_item(Key={"device_id": device_id})
        discord_id = response.get("Item", {}).get("discord_id")
        if discord_id:
            discord_ids.add(discord_id)
    return list(discord_ids)

def send_discord_notification(discord_ids, store_id, expiring_items):
    """
    Lambda C (後半): Discord に Webhook で通知を送信。
    discord_ids をメンションに含める。
    """
    if not DISCORD_WEBHOOK_URL:
        print("Error: DISCORD_WEBHOOK_URL is not set.")
        return

    # メンション文字列を組み立て（Discord は <@USER_ID> 形式）
    mentions = " ".join([f"<@{did}>" for did in discord_ids]) if discord_ids else ""

    embeds = []
    for item in expiring_items:
        days = item["days_remaining"]
        if days < 0:
            color, status = 16711680, "⚠️ 既に期限切れ！"
        elif days == 0:
            color, status = 16711680, "🚨 本日が消費期限"
        elif days == 1:
            color, status = 16753920, "明日が消費期限"
        else:
            color, status = 16776960, f"残り {days} 日"

        embeds.append({
            "title": f"📦 {item['product_name']}",
            "color": color,
            "fields": [
                {"name": "消費期限", "value": f"{item['expiration_date']}（{status}）", "inline": True},
                {"name": "在庫数",   "value": f"{item['stock']} 個",                   "inline": True},
                {"name": "店舗",     "value": store_id,                                "inline": False}
            ]
        })

    payload = {
        "content": f"🔔 **近くのコンビニに期限間近の商品があります！** {mentions}",
        "embeds": embeds[:10]  # Discord の上限は10個
    }

    req = urllib.request.Request(
        DISCORD_WEBHOOK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(req)
        print(f"[{store_id}] Discord 通知成功: {len(discord_ids)} 人, {len(expiring_items)} 商品")
    except Exception as e:
        print(f"[{store_id}] Discord 通知失敗: {e}")

def hourly_notify(event, context):
    """
    EventBridge Scheduler から 1時間ごとに呼ばれるメイン関数。
    """
    # A: 期限間近な商品を店舗ごとに取得
    expiring_by_store = get_expiring_items_by_store()

    if not expiring_by_store:
        print("期限間近な商品はありません。")
        return {"statusCode": 200, "body": "No expiring items."}

    notified_count = 0
    for store_id, items in expiring_by_store.items():
        # B: その店舗の近くにいるデバイスを取得
        device_ids = get_devices_near_store(store_id)
        if not device_ids:
            print(f"[{store_id}] 近くにユーザーがいません。スキップ。")
            continue

        # C: DeviceID → Discord ID に変換
        discord_ids = get_discord_ids(device_ids)
        if not discord_ids:
            print(f"[{store_id}] Discord ID が見つかりません。スキップ。")
            continue

        # Discord に通知
        send_discord_notification(discord_ids, store_id, items)
        notified_count += 1

    return {
        "statusCode": 200,
        "body": json.dumps(f"{notified_count} 店舗に通知しました。")
    }
