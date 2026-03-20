# 一石四鳥モバイルシステム

物流担当者・店舗スタッフ・顧客・企業が全員メリットを得られるAWSベースの在庫管理システム。

## 機能概要

| 機能 | 内容 | 主なAWSサービス |
|---|---|---|
| 機能① | SNSバズ検知・在庫増加提案 | EventBridge, Lambda, Bedrock, DynamoDB, SNS |
| 機能② | 店舗在庫管理・賞味期限切れ通知 | API Gateway, Lambda, S3, Bedrock, DynamoDB, EventBridge, Discord |
| 機能③ | 売上データ分析・新商品提案 | S3, Glue, Athena, Bedrock |

---
##アーキテクチャ

<p align="center">
  <img src="image/final_.drawio.png" width="200">
</p>

---
## 機能① SNSバズ検知・在庫増加提案

SNS上のトレンドをリアルタイムで検知し、売れ筋商品の在庫増加をスタッフに提案する。

### 処理フロー
```
EventBridge（定期実行）
  → collect_sns_data Lambda：SNSデータ収集・S3保存
  → calculate_buzz Lambda：Bedrockでバズスコア算出
  → stream_processor Lambda：DynamoDB更新・SNS通知
```

### 主要ファイル
```
feature1/
├── lambda_handlers/
│   ├── collect_sns_data.py   # SNSデータ収集
│   ├── calculate_buzz.py     # バズスコア算出
│   └── stream_processor.py  # DynamoDB更新・通知
└── template.yaml             # SAMテンプレート
```

---

## 機能② 店舗在庫管理・賞味期限切れ通知

### スタッフ側フロー
```
商品画像アップロード（最大3枚）
  → S3保存（Pre-signed URL）＋ Bedrock AI分析（並行実行）
  → 商品名・賞味期限をAIが自動抽出 → スタッフが確認・編集
  → DynamoDB（function_2テーブル）に登録
```

### 顧客側フロー
```
「近くのコンビニを探す」ボタン
  → Geolocation APIで現在地取得（1回のみ）
  → API Gateway → Lambda：Haversine公式で半径1km以内の店舗を特定
  → DynamoDBから期限間近の商品を抽出 → カード形式で表示
```

### 通知フロー
```
EventBridge（毎朝定刻）→ notify_expiration Lambda
  → DynamoDBをスキャンし期限3日以内の商品をDiscord通知
```

### DynamoDBテーブル

**`function_2`（在庫管理）**

| 属性名 | 型 | 説明 |
|---|---|---|
| `SSID` | Number (PK) | セッションID |
| `product_name` | String | 商品名 |
| `expiration_date` | String | 消費期限（YYYY/MM/DD） |
| `stock_quantity` | Number | 在庫数 |
| `StoreID` | String | 店舗ID |

**`Stores`（店舗情報）**

| 属性名 | 型 | 説明 |
|---|---|---|
| `StoreID` | String (PK) | 店舗ID |
| `StoreName` | String | 店舗名 |
| `Lat` / `Lng` | Number | 緯度・経度 |

### Lambda関数

| 関数名 | トリガー | 役割 |
|---|---|---|
| `give_URL.py` | API Gateway POST `/upload` | S3 Pre-signed URL発行 |
| `pass_to_bedrock.py` | Lambda Function URL | 画像AI分析・DynamoDB保存 |
| `search_nearby_stores.py` | API Gateway POST `/search` | 近隣店舗・期限商品検索 |
| `notify_expiration.py` | EventBridge（定期） | Discord期限切れ通知 |

---

## 機能③ 売上データ分析・新商品提案

過去の売上データをGlue・Athenaで分析し、Bedrockが新商品を提案する。

### 処理フロー
```
S3（売上データ）→ Glue（キーワード抽出・人気スコア算出）
  → Athena（SQLクエリ）→ Bedrock（新商品提案・画像生成）→ フロント表示
```

### 主要ファイル
```
src/
├── glue.py       # Glueジョブ：キーワード抽出・スコア算出
└── athena.sql    # 人気スコア集計クエリ
```

---

## フロントエンド

```
frontend/src/pages/
├── TopPage.jsx      # トップ（店員用 / 顧客用 / 商品開発側 / 在庫管理側）
├── StaffPage.jsx    # 店員用：画像アップロード・AI分析・在庫登録
└── CustomerPage.jsx # 顧客用：近隣コンビニ・期限間近商品の表示

frontend/public/
└── product-dev.html # 商品開発側（機能③フロントエンド）
```
