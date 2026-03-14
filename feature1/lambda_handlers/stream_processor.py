"""
DynamoDB Streams → Firehose 転送 Lambda
DynamoDB Streams のイベントを受け取り、Kinesis Data Firehose に転送する。
これにより DynamoDB のデータが自動的に S3 データレイクに保存される。
"""
import json
import logging
import os
import sys
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger()
logger.setLevel(logging.INFO)

FIREHOSE_STREAM_NAME = os.environ.get("FIREHOSE_STREAM_NAME", "feature1-dynamodb-to-s3")


def handler(event, context):
    """
    DynamoDB Streams → Firehose 転送ハンドラー
    INSERT / MODIFY イベントのみを Firehose に送信する。
    """
    records_to_send = []

    for record in event.get("Records", []):
        event_name = record.get("eventName", "")

        # INSERT または MODIFY のみ処理
        if event_name not in ("INSERT", "MODIFY"):
            continue

        # DynamoDB のイメージをフラットなJSONに変換
        new_image = record.get("dynamodb", {}).get("NewImage", {})
        if not new_image:
            continue

        flat_record = _dynamodb_to_flat(new_image)
        flat_record["_event_type"] = event_name
        flat_record["_event_id"] = record.get("eventID", "")

        # JSON Lines 形式（末尾に改行）
        json_line = json.dumps(flat_record, ensure_ascii=False) + "\n"
        records_to_send.append(json_line)

    if not records_to_send:
        logger.info("転送対象のレコードなし")
        return {"statusCode": 200, "processed": 0}

    # Firehose に送信
    import boto3
    firehose = boto3.client("firehose")

    # Firehose は1回に最大500レコード
    batch_size = 500
    total_sent = 0

    for i in range(0, len(records_to_send), batch_size):
        batch = records_to_send[i : i + batch_size]
        firehose_records = [{"Data": r.encode("utf-8")} for r in batch]

        response = firehose.put_record_batch(
            DeliveryStreamName=FIREHOSE_STREAM_NAME,
            Records=firehose_records,
        )
        failed = response.get("FailedPutCount", 0)
        total_sent += len(batch) - failed

        if failed > 0:
            logger.warning(f"Firehose 送信失敗: {failed} 件")

    logger.info(f"📦 Firehose 転送完了: {total_sent}/{len(records_to_send)} 件")
    return {"statusCode": 200, "processed": total_sent}


def _dynamodb_to_flat(dynamodb_image: dict) -> dict[str, Any]:
    """DynamoDB の型付きJSONをフラットなJSONに変換する"""
    result = {}
    for key, value_dict in dynamodb_image.items():
        result[key] = _parse_dynamodb_value(value_dict)
    return result


def _parse_dynamodb_value(value_dict: dict) -> Any:
    """DynamoDB の型情報を解析して通常の値に変換"""
    if "S" in value_dict:
        return value_dict["S"]
    elif "N" in value_dict:
        num = value_dict["N"]
        return float(num) if "." in num else int(num)
    elif "BOOL" in value_dict:
        return value_dict["BOOL"]
    elif "NULL" in value_dict:
        return None
    elif "L" in value_dict:
        return [_parse_dynamodb_value(v) for v in value_dict["L"]]
    elif "M" in value_dict:
        return {k: _parse_dynamodb_value(v) for k, v in value_dict["M"].items()}
    elif "SS" in value_dict:
        return list(value_dict["SS"])
    elif "NS" in value_dict:
        return [float(n) if "." in n else int(n) for n in value_dict["NS"]]
    else:
        return str(value_dict)
