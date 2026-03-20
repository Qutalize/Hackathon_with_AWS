import json
import os
import math
import boto3
from datetime import datetime, timedelta, timezone

# 環境変数
STORES_TABLE   = os.environ.get("STORES_TABLE", "Stores")
PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE", "function_2")
THRESHOLD_DAYS = int(os.environ.get("THRESHOLD_DAYS", 3))
RADIUS_KM      = float(os.environ.get("RADIUS_KM", 1.0))
REGION         = os.environ.get("AWS_REGION", "ap-northeast-1")

dynamodb = boto3.resource("dynamodb", region_name=REGION)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

JST = timezone(timedelta(hours=9), "JST")


def haversine_km(lat1, lng1, lat2, lng2):
    """2点間の距離をkm単位で返す"""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def search_nearby_stores(event, context):
    # プリフライト
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
        user_lat = body.get("lat")
        user_lng = body.get("lng")

        if user_lat is None or user_lng is None:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "lat and lng are required"}),
            }

        user_lat = float(user_lat)
        user_lng = float(user_lng)

        # --- 1. Stores テーブルを全件取得してHaversineで距離計算 ---
        stores_table = dynamodb.Table(STORES_TABLE)
        res = stores_table.scan()
        all_stores = res.get("Items", [])
        while "LastEvaluatedKey" in res:
            res = stores_table.scan(ExclusiveStartKey=res["LastEvaluatedKey"])
            all_stores.extend(res.get("Items", []))

        nearby_stores = []
        for store in all_stores:
            lat = float(store.get("Lat", 0))
            lng = float(store.get("Lng", 0))
            dist_km = haversine_km(user_lat, user_lng, lat, lng)
            if dist_km <= RADIUS_KM:
                nearby_stores.append({
                    "store_id":   store.get("StoreID", ""),
                    "store_name": store.get("StoreName", ""),
                    "distance":   round(dist_km * 1000),  # メートルに変換
                })

        if not nearby_stores:
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"stores": []}, ensure_ascii=False),
            }

        # --- 2. function_2 テーブルから期限間近・在庫ありの商品を取得 ---
        products_table = dynamodb.Table(PRODUCTS_TABLE)
        res = products_table.scan()
        all_products = res.get("Items", [])
        while "LastEvaluatedKey" in res:
            res = products_table.scan(ExclusiveStartKey=res["LastEvaluatedKey"])
            all_products.extend(res.get("Items", []))

        today = datetime.now(JST).date()
        threshold_date = today + timedelta(days=THRESHOLD_DAYS)

        nearby_store_ids = {s["store_id"] for s in nearby_stores}
        products_by_store = {sid: [] for sid in nearby_store_ids}

        for item in all_products:
            store_id = item.get("StoreID", "")
            if store_id not in nearby_store_ids:
                continue
            if int(item.get("stock_quantity", 0)) <= 0:
                continue

            exp_str = item.get("expiration_date", "")
            try:
                exp_date = datetime.strptime(exp_str, "%Y/%m/%d").date()
            except ValueError:
                continue

            if exp_date <= threshold_date:
                products_by_store[store_id].append({
                    "product_name":    item.get("product_name", ""),
                    "expiration_date": exp_str,
                    "days_remaining":  (exp_date - today).days,
                    "stock_quantity":  int(item.get("stock_quantity", 0)),
                })

        # --- 3. レスポンス組み立て（距離順にソート）---
        result = []
        for store in sorted(nearby_stores, key=lambda s: s["distance"]):
            result.append({
                **store,
                "products": products_by_store.get(store["store_id"], []),
            })

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"stores": result}, ensure_ascii=False),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }
