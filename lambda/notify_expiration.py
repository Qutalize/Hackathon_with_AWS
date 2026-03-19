import json
import boto3
import os
import urllib.request
from datetime import datetime, timedelta, timezone

# 環境変数 (設定がなければデフォルト値を使用)
DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "function_2")
# AWS Lambdaの環境変数「DISCORD_WEBHOOK_URL」からWebhook URLを取得（ハードコード排除）
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")
# 何日前に通知するか（デフォルト3日前）
THRESHOLD_DAYS = int(os.environ.get("THRESHOLD_DAYS", 3))

# Lambdaの実行環境の権限によってリージョンが変わらないよう明示的に指定
dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')

def notify_expiration(event, context):
    if not DISCORD_WEBHOOK_URL:
        print("Error: DISCORD_WEBHOOK_URL is not set in environment variables.")
        return {'statusCode': 500, 'body': 'Missing webhook configuration.'}
        
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)
    
    # 1. 日本時間（JST）における「今日」の日付を取得
    JST = timezone(timedelta(hours=+9), 'JST')
    today_jst = datetime.now(JST).date()
    
    # 2. DynamoDBのアイテムを全件取得（Scan）
    # ※ハッカソン規模ならScanで十分。大規模ならGSI推奨
    response = table.scan()
    items = response.get('Items', [])
    
    # ページネーション（1回のScanで取り切れなかった場合の処理）
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))
        
    alerts = []
    
    # 3. 期限判定
    for item in items:
        exp_date_str = item.get('expiration_date')
        if not exp_date_str:
            continue
            
        # "YYYY/MM/DD" 形式をPythonの日付オブジェクトに変換
        try:
            exp_date = datetime.strptime(exp_date_str, '%Y/%m/%d').date()
        except ValueError:
            # 万が一フォーマットが不正なものは一旦スキップ
            continue
            
        # 残り日数を計算
        days_remaining_obj = exp_date - today_jst
        days_remaining = days_remaining_obj.days
        
        # 在庫が0の場合は期限が切れても通知しない
        stock = int(item.get('stock_quantity', 0))
        if stock <= 0:
            continue
        
        # 通知対象: 残り日数が設定値(3日)以下の場合 (期限切れのものも含める)
        if days_remaining <= THRESHOLD_DAYS:
            alerts.append({
                'product_name': item.get('product_name', '不明な商品'),
                'exp_date_str': exp_date_str,
                'days_remaining': days_remaining,
                'stock': stock
            })
                
    # 通知対象がなければ終了
    if not alerts:
        print("消費期限が迫っている商品はありません。")
        return {'statusCode': 200, 'body': 'No items to alert.'}
        
    # 4. Discord通知用のメッセージ組み立て
    embeds = []
    for alert in alerts:
        # 残り日数に応じて色やメッセージを変える
        if alert['days_remaining'] < 0:
            color = 16711680 # 赤色
            status_msg = "⚠️ 既に期限が切れています！"
        elif alert['days_remaining'] == 0:
            color = 16711680 # 赤色
            status_msg = "🚨 本日が消費期限です"
        elif alert['days_remaining'] == 1:
            color = 16753920 # オレンジ
            status_msg = "明日が消費期限です"
        else:
            color = 16776960 # 黄色
            status_msg = f"残り {alert['days_remaining']} 日"
           
        embeds.append({
            "title": f"📦 {alert['product_name']}",
            "color": color,
            "fields": [
                {"name": "消費期限", "value": f"{alert['exp_date_str']}\n（{status_msg}）", "inline": True},
                {"name": "在庫数", "value": f"{alert['stock']} 個", "inline": True}
            ]
        })
        
    # DiscordのAPIは1メッセージにつきEmbedが10個までという制限があるため分割
    # 今回はシンプルに最初の10個に絞って送信する (ハッカソン用)
    payload = {
        "content": "🔔 **在庫消費期限アラート**\n以下の商品の消費期限が迫っています。確認・消費をお願いします！",
        "embeds": embeds[:10]
    }
    
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "DiscordBot (Python/urllib)"
    }
    
    # 5. DiscordへHTTP POSTリクエストを送信
    req = urllib.request.Request(
        DISCORD_WEBHOOK_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        urllib.request.urlopen(req)
        print("Discordへの通知に成功しました。")
    except Exception as e:
        print(f"Discord通知中にエラーが発生: {e}")
        
    return {
        'statusCode': 200,
        'body': json.dumps('Notifications sent.')
    }
