# 機能① SNS人気商品データ収集・在庫増加パイプライン

## 概要

SNS（YouTube, X, Instagram）から人気商品情報を自動収集し、生成AI（Gemini → 本番: Bedrock）で
感情分析・商品名抽出、バズ度を算出して担当者に通知するパイプラインです。

## アーキテクチャ

```
EventBridge（定期実行）
  ↓
Lambda①: SNSデータ収集 → 生成AI(Gemini)で感情分析・商品名抽出 → DynamoDB保存
  ↓
Lambda②: バズ度計算 → AWS SNSで担当者通知
  
DynamoDB → Streams → Data Firehose → S3 データレイク（自動パイプライン）
```

## クイックスタート（デモモード）

APIキーなしでサンプルデータを使って動作確認できます。

```bash
cd feature1
pip install -r requirements.txt
python run_pipeline.py
```

## 環境変数

| 環境変数 | 説明 | デフォルト |
|---|---|---|
| `DEMO_MODE` | デモモード（true/false） | `true` |
| `GEMINI_API_KEY` | Google Gemini API キー（Bedrock代替） | - |
| `YOUTUBE_API_KEY` | YouTube Data API v3 キー | - |
| `TWITTER_BEARER_TOKEN` | X(Twitter) API Bearer Token | - |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram Graph API Token | - |
| `DYNAMODB_TABLE_NAME` | DynamoDBテーブル名 | `feature1_sns_data` |
| `S3_BUCKET_NAME` | S3バケット名 | `feature1-data-lake` |
| `SNS_TOPIC_ARN` | 通知用SNSトピックARN | - |

## AWSデプロイ

```bash
sam build
sam deploy --guided
```

## ファイル構成

```
feature1/
├── config.py                       # 環境変数・設定管理
├── requirements.txt                # Python依存パッケージ
├── template.yaml                   # AWS SAM テンプレート
├── run_pipeline.py                 # デモ用パイプライン一括実行
├── lambda_handlers/
│   ├── collect_sns_data.py         # Lambda① SNS収集 + 生成AI分析
│   ├── calculate_buzz.py           # Lambda② バズ度計算 + SNS通知
│   └── stream_processor.py        # DynamoDB Streams → Firehose 転送
└── utils/
    ├── sns_clients.py              # YouTube/X/Instagram APIクライアント
    ├── llm_client.py               # 生成AI（Gemini/Bedrock）統合クライアント
    ├── dynamo_client.py            # DynamoDB 操作
    ├── s3_client.py                # S3 データレイク操作
    └── notification.py             # AWS SNS 通知
```

## バズ度計算ロジック

```
バズ度(0~100) = 
  log正規化(いいね数) × 0.3 + log正規化(コメント数) × 0.2
  + log正規化(シェア数) × 0.2 + 感情ポジティブ度 × 0.3

推奨発注量 = 基本発注量(10) × (1 + バズ度/100 × 1.5)
```

## Bedrock切替ガイド（ハッカソン当日）

`utils/llm_client.py` 内の `LLMClient` クラスで `_get_model()` を
Bedrock クライアントに差し替えるだけで切替可能です。
