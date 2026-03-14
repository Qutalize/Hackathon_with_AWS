"""
S3 データレイク クライアントモジュール
学習用データ（商品名, ジャンル, 在庫増加量）をS3へ保存する。
DEMO_MODE の場合はローカルファイルに保存する。
"""
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class S3Client:
    """S3 データレイクへのデータ投下クライアント"""

    def __init__(
        self,
        bucket_name: str,
        prefix: str = "feature1/raw/",
        region: str = "ap-northeast-1",
        demo_mode: bool = False,
    ):
        self.bucket_name = bucket_name
        self.prefix = prefix
        self.region = region
        self.demo_mode = demo_mode
        self._client = None

    def _get_client(self):
        if self._client is None:
            import boto3
            self._client = boto3.client("s3", region_name=self.region)
        return self._client

    def upload_learning_data(self, records: list[dict[str, Any]]) -> str:
        """
        学習用データをS3にアップロードする。
        JSON Lines 形式で保存。
        Returns: アップロード先のS3キー or ローカルパス
        """
        now = datetime.now(timezone.utc)
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        date_partition = now.strftime("year=%Y/month=%m/day=%d")
        key = f"{self.prefix}{date_partition}/feature1_buzz_data_{timestamp}.jsonl"

        # JSON Lines 形式に変換
        jsonl_body = "\n".join(json.dumps(r, ensure_ascii=False) for r in records)

        if self.demo_mode:
            # ローカルに保存
            local_dir = os.path.join("demo_output", "s3", self.prefix, date_partition)
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, f"feature1_buzz_data_{timestamp}.jsonl")
            with open(local_path, "w", encoding="utf-8") as f:
                f.write(jsonl_body)
            logger.info(f"📦 [デモ] ローカル保存: {local_path} ({len(records)} 件)")
            return local_path

        client = self._get_client()
        client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=jsonl_body.encode("utf-8"),
            ContentType="application/jsonl",
        )
        s3_uri = f"s3://{self.bucket_name}/{key}"
        logger.info(f"📦 S3 アップロード完了: {s3_uri} ({len(records)} 件)")
        return s3_uri

    def upload_summary_report(self, report: dict[str, Any]) -> str:
        """
        サマリーレポートをS3にアップロードする。
        機能③ (Glue/SageMaker) との連携用。
        """
        now = datetime.now(timezone.utc)
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        date_partition = now.strftime("year=%Y/month=%m/day=%d")
        key = f"{self.prefix}summaries/{date_partition}/summary_{timestamp}.json"

        body = json.dumps(report, ensure_ascii=False, indent=2)

        if self.demo_mode:
            local_dir = os.path.join("demo_output", "s3", self.prefix, "summaries", date_partition)
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, f"summary_{timestamp}.json")
            with open(local_path, "w", encoding="utf-8") as f:
                f.write(body)
            logger.info(f"📊 [デモ] サマリー保存: {local_path}")
            return local_path

        client = self._get_client()
        client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=body.encode("utf-8"),
            ContentType="application/json",
        )
        s3_uri = f"s3://{self.bucket_name}/{key}"
        logger.info(f"📊 S3 サマリーアップロード完了: {s3_uri}")
        return s3_uri
