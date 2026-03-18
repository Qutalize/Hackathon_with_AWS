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
| 機能② | API Gateway, Lambda, S3, Bedrock, DynamoDB, Pinpoint |
| 機能③ | S3, Glue, SageMaker, QuickSight, Bedrock |
