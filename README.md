# 一石四鳥モバイルシステム

物流担当者・店舗スタッフ・顧客・企業が全員メリットを得られるAWSベースの在庫管理システム。

## 機能概要

- **機能①** SNSバズ検知・在庫増加提案
- **機能②** 店舗在庫管理・賞味期限切れ通知
- **機能③** データ分析・新商品提案

## システム構成

| 機能 | 主なAWSサービス |
|---|---|
| 機能① | EventBridge, Lambda, Bedrock, DynamoDB, SNS |
| 機能② | API Gateway, Lambda, S3, Bedrock, DynamoDB, EventBridge, Discord Webhook, Location Service |
| 機能③ | S3, Glue, SageMaker, QuickSight, Bedrock |

---

## 機能② 詳細仕様：店舗在庫管理・賞味期限切れ通知

### コンセプト

「今、ここにあるおトク」
ユーザーがアプリを開いてボタンを押した瞬間、その場所から半径1km以内にある店舗の **期限間近＝割引商品** をリストアップするサービス。

- **ターゲット**: 節約したい学生・会社員、食品ロス削減に貢献したいユーザー
- **価値**: 「安い」という実利と「社会貢献」を両立
- **強み**: 常時位置追跡を行わないため、プライバシー保護と低消費電力を実現

---

### AWSアーキテクチャ構成

| サービス | 役割 |
|---|---|
| AWS Amplify | フロントエンド（React）のホスティング |
| Amazon API Gateway | リクエスト受付（プロキシ統合） |
| AWS Lambda | 判定・クエリロジックの実行（Python / Boto3） |
| Amazon DynamoDB | 店舗情報および商品在庫の管理 |
| Amazon S3 | 商品画像の保存（Pre-signed URL経由） |
| Amazon Bedrock | 商品画像からの情報抽出（AI分析） |
| Amazon EventBridge | 定期実行スケジューラー（毎朝通知トリガー） |
| Discord Webhook | 期限切れアラートの通知先 |
| AWS Location Service | Place Indexを利用した半径1km以内の店舗検索 |

---

### 処理フロー

#### スタッフ側（在庫登録フロー）

```
1. スタッフが商品画像（最大3枚）をアップロード / カメラ撮影
2. フロントエンド（StaffPage）が以下を並行実行：
   a. give_URL Lambda → S3 Pre-signed URL取得 → 画像をS3に直接PUT
   b. Bedrock API → 画像からJSON形式で商品情報を抽出（品名・賞味期限・在庫数）
3. スタッフが在庫数を手動入力・AI抽出結果を確認・編集
4. 確定後、DynamoDB（function_2テーブル）に商品情報を登録
```

#### 顧客側（近隣割引商品検索フロー）

```
1. 顧客がWebアプリ上の「おトク情報を探す」ボタンをクリック
2. ブラウザのGeolocation API（navigator.geolocation）で緯度・経度を1回のみ取得
3. API Gateway 経由で AWS Lambda に座標をPOST送信
4. Lambda が AWS Location Service を使用し、半径1km以内の店舗を特定
5. 特定された店舗IDをキーにDynamoDBをクエリし、期限間近の商品を抽出
6. フロントエンド（CustomerPage）でカード形式で商品一覧を表示
```

#### 通知フロー（自動アラート）

```
1. Amazon EventBridge が毎朝定刻にトリガー
2. notify_expiration Lambda が起動
3. DynamoDB（function_2テーブル）を全件スキャン
4. 本日から3日以内（THRESHOLD_DAYS）に期限が到来する商品を抽出
5. Discord Webhook にEmbedメッセージとしてPOST送信
   - 期限切れ → 赤色（⚠️ 既に期限が切れています！）
   - 本日期限 → 赤色（🚨 本日が消費期限です）
   - 翌日期限 → オレンジ（明日が消費期限です）
   - 3日以内  → 黄色（残り N 日）
```

---

### DynamoDB テーブル設計

#### `function_2` テーブル（在庫管理）

| 属性名 | 型 | 説明 |
|---|---|---|
| `product_name` | String | 商品名（PK） |
| `expiration_date` | String | 消費期限（`YYYY/MM/DD` 形式） |
| `stock_quantity` | Number | 在庫数（0以下は通知対象外） |

> **注意**: ソートキーに期限を含めることで、現在時刻に近い商品を高速スキャン可能。大規模運用時はGSI推奨。

#### `Stores` テーブル（店舗情報）

| 属性名 | 型 | 説明 |
|---|---|---|
| `StoreID` | String | 店舗ID（PK） |
| `StoreName` | String | 店舗名 |
| `Coordinates` | Map | 緯度（Lat）・経度（Lng） |

---

### Lambda 関数仕様

#### `give_URL.py` — S3 Pre-signed URL 発行

- **トリガー**: API Gateway POST `/upload`
- **入力**: `{ "fileName": "商品名.jpg", "fileType": "image/jpeg" }`
- **処理**: `uploads/{timestamp}-{fileName}` のキーでPut用Pre-signed URL（有効期限5分）を生成
- **出力**: `{ "presignedUrl": "...", "url": "https://...", "key": "..." }`
- **環境変数**:
  - `BUCKET_NAME` — アップロード先S3バケット名

#### `notify_expiration.py` — 期限切れ通知

- **トリガー**: Amazon EventBridge（定期実行）
- **処理**: DynamoDBをスキャンし、期限が`THRESHOLD_DAYS`日以内の在庫ありアイテムをDiscordに通知
- **環境変数**:
  - `DYNAMODB_TABLE_NAME` — 対象テーブル名（デフォルト: `function_2`）
  - `DISCORD_WEBHOOK_URL` — Discord Webhook URL（必須）
  - `THRESHOLD_DAYS` — 通知する残り日数の閾値（デフォルト: `3`）

---

### フロントエンド構成

```
frontend/src/
├── App.jsx          # ページルーティング（top / staff / customer）
├── main.jsx         # エントリーポイント
└── pages/
    ├── TopPage.jsx      # トップページ（スタッフ/顧客への導線）
    ├── StaffPage.jsx    # スタッフ向け：商品画像アップロード・AI分析・在庫登録
    └── CustomerPage.jsx # 顧客向け：近隣割引商品の検索・表示（開発中）
```

#### `StaffPage.jsx` の主な機能

- ファイル選択 / カメラ撮影（最大3枚）
- 画像プレビューとドラッグ＆ドロップ対応
- S3への直接アップロード（Pre-signed URL使用）と Bedrock AI分析を並行実行
- AI抽出結果のテキスト編集（修正可能）
- 在庫数の手動入力

#### `CustomerPage.jsx` の主な機能（実装予定）

- 「おトク情報を探す」ボタンで位置情報を1回取得
- 半径1km以内の期限間近商品をカード形式で表示

---

### 環境変数

`frontend/.env`（`.env.example` を参考に作成）

| 変数名 | 説明 |
|---|---|
| `VITE_API_URL` | S3 Pre-signed URL発行API（API Gateway エンドポイント） |
| `VITE_BEDROCK_API_URL` | Bedrock AI分析API（API Gateway エンドポイント） |
