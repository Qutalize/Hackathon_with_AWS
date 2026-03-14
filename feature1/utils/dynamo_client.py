"""
DynamoDB クライアントモジュール
SNS投稿データの保存・取得を行う。
DEMO_MODE の場合はローカルの辞書型ストアを使用する。
"""
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)


class LocalStore:
    """デモ用のインメモリデータストア"""

    def __init__(self):
        self._data: dict[str, dict[str, Any]] = {}

    def put_item(self, item: dict[str, Any]) -> None:
        key = item.get("post_id", "")
        self._data[key] = item

    def get_item(self, post_id: str) -> dict[str, Any] | None:
        return self._data.get(post_id)

    def scan_all(self) -> list[dict[str, Any]]:
        return list(self._data.values())

    def update_item(self, post_id: str, updates: dict[str, Any]) -> None:
        if post_id in self._data:
            self._data[post_id].update(updates)

    def query_by_platform(self, platform: str) -> list[dict[str, Any]]:
        return [v for v in self._data.values() if v.get("platform") == platform]


class DynamoClient:
    """DynamoDB を使ったSNSデータの永続化クライアント"""

    def __init__(
        self,
        table_name: str,
        region: str = "ap-northeast-1",
        demo_mode: bool = False,
    ):
        self.table_name = table_name
        self.region = region
        self.demo_mode = demo_mode
        self._table = None
        self._local_store = LocalStore() if demo_mode else None

    def _get_table(self):
        if self._table is None:
            import boto3
            dynamodb = boto3.resource("dynamodb", region_name=self.region)
            self._table = dynamodb.Table(self.table_name)
        return self._table

    @staticmethod
    def _convert_floats(obj: Any) -> Any:
        """floatをDecimalに変換（DynamoDB対応）"""
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {k: DynamoClient._convert_floats(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [DynamoClient._convert_floats(v) for v in obj]
        return obj

    @staticmethod
    def _convert_decimals(obj: Any) -> Any:
        """Decimalをfloatに変換（JSON互換）"""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {k: DynamoClient._convert_decimals(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [DynamoClient._convert_decimals(v) for v in obj]
        return obj

    def save_post(self, post: dict[str, Any]) -> None:
        """SNS投稿データを保存する"""
        item = {
            **post,
            "saved_at": datetime.now(timezone.utc).isoformat(),
        }

        if self.demo_mode:
            self._local_store.put_item(item)
            logger.info(f"📝 [デモ] 保存: {item.get('post_id', 'unknown')}")
            return

        table = self._get_table()
        converted = self._convert_floats(item)
        table.put_item(Item=converted)
        logger.info(f"📝 DynamoDB 保存: {item.get('post_id', 'unknown')}")

    def save_posts_batch(self, posts: list[dict[str, Any]]) -> int:
        """SNS投稿データをバッチ保存する"""
        saved_count = 0

        if self.demo_mode:
            for post in posts:
                self._local_store.put_item({
                    **post,
                    "saved_at": datetime.now(timezone.utc).isoformat(),
                })
                saved_count += 1
            logger.info(f"📝 [デモ] {saved_count} 件バッチ保存完了")
            return saved_count

        table = self._get_table()
        with table.batch_writer() as batch:
            for post in posts:
                item = {
                    **post,
                    "saved_at": datetime.now(timezone.utc).isoformat(),
                }
                converted = self._convert_floats(item)
                batch.put_item(Item=converted)
                saved_count += 1

        logger.info(f"📝 DynamoDB {saved_count} 件バッチ保存完了")
        return saved_count

    def get_post(self, post_id: str) -> dict[str, Any] | None:
        """投稿IDでデータを取得する"""
        if self.demo_mode:
            return self._local_store.get_item(post_id)

        table = self._get_table()
        response = table.get_item(Key={"post_id": post_id})
        item = response.get("Item")
        return self._convert_decimals(item) if item else None

    def get_all_posts(self) -> list[dict[str, Any]]:
        """全投稿データを取得する"""
        if self.demo_mode:
            return self._local_store.scan_all()

        table = self._get_table()
        items = []
        response = table.scan()
        items.extend(response.get("Items", []))

        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))

        return [self._convert_decimals(item) for item in items]

    def update_post(self, post_id: str, updates: dict[str, Any]) -> None:
        """投稿データを更新する"""
        if self.demo_mode:
            self._local_store.update_item(post_id, updates)
            logger.info(f"🔄 [デモ] 更新: {post_id}")
            return

        table = self._get_table()
        update_expr_parts = []
        attr_values = {}
        attr_names = {}

        for key, value in updates.items():
            safe_key = f"#k_{key}"
            val_key = f":v_{key}"
            update_expr_parts.append(f"{safe_key} = {val_key}")
            attr_names[safe_key] = key
            attr_values[val_key] = self._convert_floats(value)

        table.update_item(
            Key={"post_id": post_id},
            UpdateExpression="SET " + ", ".join(update_expr_parts),
            ExpressionAttributeNames=attr_names,
            ExpressionAttributeValues=attr_values,
        )
        logger.info(f"🔄 DynamoDB 更新: {post_id}")
