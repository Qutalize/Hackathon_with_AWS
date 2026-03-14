"""
通知モジュール
AWS SNS を使って在庫増加推奨情報を担当者に通知する。
DEMO_MODE の場合はコンソール出力。
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class NotificationClient:
    """AWS SNS を使った通知クライアント"""

    def __init__(
        self,
        topic_arn: str = "",
        region: str = "ap-northeast-1",
        demo_mode: bool = False,
    ):
        self.topic_arn = topic_arn
        self.region = region
        self.demo_mode = demo_mode
        self._client = None

    def _get_client(self):
        if self._client is None:
            import boto3
            self._client = boto3.client("sns", region_name=self.region)
        return self._client

    def send_restock_notification(
        self, recommendations: list[dict[str, Any]]
    ) -> str | None:
        """
        在庫増加推奨情報を担当者に通知する。

        Args:
            recommendations: [
                {
                    "product_name": str,
                    "genre": str,
                    "store": str,
                    "buzz_score": float,
                    "recommended_quantity": int,
                    "reason": str,
                },
                ...
            ]

        Returns:
            メッセージID（デモモードではNone）
        """
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        # 通知メッセージを構築
        subject = f"【在庫増加推奨】{len(recommendations)}件の商品 - {now}"
        body = self._build_notification_body(recommendations, now)

        if self.demo_mode:
            logger.info("=" * 60)
            logger.info("📢 [デモ] 在庫増加推奨通知")
            logger.info("=" * 60)
            logger.info(f"件名: {subject}")
            logger.info(body)
            logger.info("=" * 60)
            print("\n" + "=" * 60)
            print("📢 在庫増加推奨通知")
            print("=" * 60)
            print(f"件名: {subject}")
            print(body)
            print("=" * 60 + "\n")
            return None

        client = self._get_client()
        response = client.publish(
            TopicArn=self.topic_arn,
            Subject=subject[:100],  # SNSの件名は100文字まで
            Message=body,
        )
        message_id = response.get("MessageId", "")
        logger.info(f"📢 SNS通知送信完了: MessageId={message_id}")
        return message_id

    @staticmethod
    def _build_notification_body(
        recommendations: list[dict[str, Any]], timestamp: str
    ) -> str:
        """通知メッセージ本文を構築する"""
        lines = [
            f"📅 分析日時: {timestamp}",
            f"📊 推奨商品数: {len(recommendations)}件",
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ]

        for i, rec in enumerate(recommendations, 1):
            lines.extend([
                f"",
                f"【{i}】{rec.get('product_name', '不明')}",
                f"  📦 ジャンル: {rec.get('genre', '不明')}",
                f"  🏪 店舗: {rec.get('store', '不明')}",
                f"  🔥 バズ度: {rec.get('buzz_score', 0):.1f} / 100",
                f"  📈 推奨追加発注量: +{rec.get('recommended_quantity', 0)} 個",
                f"  💡 根拠: {rec.get('reason', '')}",
                f"  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            ])

        lines.extend([
            "",
            "※ このメッセージは機能①（SNS人気商品分析パイプライン）から",
            "  自動送信されています。",
        ])

        return "\n".join(lines)
