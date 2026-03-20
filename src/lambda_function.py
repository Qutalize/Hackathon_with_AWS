import boto3
import json
import time
import re
import base64
import urllib.request
import urllib.parse
import urllib.error

athena  = boto3.client("athena",          region_name="ap-northeast-1")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

BUCKET         = "all-918375630428-ap-northeast-1-an"
DATABASE       = "inventory_db"
TABLE          = "training_data"
ATHENA_RESULTS = f"s3://{BUCKET}/athena-results/"

def run_athena_query(sql):
    response = athena.start_query_execution(
        QueryString=sql,
        QueryExecutionContext={"Database": DATABASE},
        ResultConfiguration={"OutputLocation": ATHENA_RESULTS}
    )
    query_id = response["QueryExecutionId"]

    for _ in range(30):
        result = athena.get_query_execution(QueryExecutionId=query_id)
        status = result["QueryExecution"]["Status"]["State"]
        print(f"Athena状態: {status}")
        if status == "SUCCEEDED":
            break
        if status in ["FAILED", "CANCELLED"]:
            reason = result["QueryExecution"]["Status"] \
                .get("StateChangeReason", "不明")
            raise Exception(f"Athenaクエリ失敗: {reason}")
        time.sleep(2)

    rows = athena.get_query_results(
        QueryExecutionId=query_id
    )["ResultSet"]["Rows"]

    headers = [c["VarCharValue"] for c in rows[0]["Data"]]
    records = []
    for row in rows[1:]:
        values = [c.get("VarCharValue", "") for c in row["Data"]]
        records.append(dict(zip(headers, values)))
    return records

def generate_image(product_name, genre, keyword):
    """Amazon Nova Canvas で画像生成"""

    image_prompt = (
        f"Product photo of {product_name}, {genre}, {keyword}, "
        f"clean white background, commercial photography, "
        f"professional product shot, high quality"
    )

    try:
        response = bedrock.invoke_model(
            modelId="amazon.nova-canvas-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "taskType": "TEXT_IMAGE",
                "textToImageParams": {
                    "text": image_prompt
                },
                "imageGenerationConfig": {
                    "numberOfImages": 1,
                    "height": 512,
                    "width": 512,
                    "quality": "standard",
                    "cfgScale": 8.0
                }
            })
        )
        image_data = json.loads(response["body"].read())
        base64_image = image_data["images"][0]
        print(f"✅ 画像生成成功: {product_name}")
        return base64_image

    except Exception as e:
        print(f"[IMAGE_ERROR] {product_name}: {type(e).__name__}: {str(e)}")
        return None

def lambda_handler(event, context):

    # =========================================
    # 1. 期間パラメータを受け取る
    # =========================================
    body = {}
    if event.get("body"):
        body = json.loads(event["body"]) \
               if isinstance(event["body"], str) \
               else event["body"]

    date_from = body.get("date_from", "2026-01-01")
    date_to   = body.get("date_to",   "2026-12-31")
    print(f"分析期間: {date_from} 〜 {date_to}")

    # =========================================
    # 2. Athena クエリ（data_date で期間フィルタ）
    # =========================================
    date_filter = f"AND data_date BETWEEN '{date_from}' AND '{date_to}'"

    sql_top = f"""
    SELECT
        genre,
        keyword_1,
        keyword_2,
        COALESCE(
            AVG(CASE WHEN stock_delta > 0 THEN stock_delta ELSE NULL END)
        , 0) AS avg_restock,
        COALESCE(
            ABS(AVG(CASE WHEN stock_delta < 0 THEN stock_delta ELSE NULL END))
        , 0) AS avg_leftover,
        COALESCE(
            AVG(CASE WHEN stock_delta > 0 THEN stock_delta ELSE NULL END)
        , 0)
        -
        COALESCE(
            ABS(AVG(CASE WHEN stock_delta < 0 THEN stock_delta ELSE NULL END))
        , 0) AS popularity_score
    FROM "{DATABASE}"."{TABLE}"
    WHERE 1=1 {date_filter}
    GROUP BY genre, keyword_1, keyword_2
    ORDER BY popularity_score DESC
    LIMIT 10
    """

    sql_worst = f"""
    SELECT
        genre,
        keyword_1,
        keyword_2,
        COALESCE(
            AVG(CASE WHEN stock_delta > 0 THEN stock_delta ELSE NULL END)
        , 0)
        -
        COALESCE(
            ABS(AVG(CASE WHEN stock_delta < 0 THEN stock_delta ELSE NULL END))
        , 0) AS popularity_score
    FROM "{DATABASE}"."{TABLE}"
    WHERE 1=1 {date_filter}
    GROUP BY genre, keyword_1, keyword_2
    ORDER BY popularity_score ASC
    LIMIT 10
    """

    print("=== Athenaクエリ開始 ===")
    top_trends   = run_athena_query(sql_top)
    worst_trends = run_athena_query(sql_worst)
    print(f"✅ 上位: {len(top_trends)}件, 下位: {len(worst_trends)}件")

    if len(top_trends) == 0:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error":        "指定期間のデータが見つかりませんでした",
                "date_from":    date_from,
                "date_to":      date_to,
                "top_trends":   [],
                "worst_trends": [],
                "proposals":    "",
                "images":       []
            }, ensure_ascii=False)
        }

    # =========================================
    # 3. Bedrock：新商品提案を生成
    # =========================================
    top_text = "\n".join([
        f"・{r['genre']} × {r['keyword_1']} × {r['keyword_2']}"
        f"　スコア: {float(r['popularity_score']):.1f}"
        for r in top_trends
    ])
    worst_text = "\n".join([
        f"・{r['genre']} × {r['keyword_1']} × {r['keyword_2']}"
        f"　スコア: {float(r['popularity_score']):.1f}"
        for r in worst_trends
    ])

    prompt = f"""あなたは食品・日用品の新商品企画の専門家です。

【分析期間】{date_from} 〜 {date_to}
【スコアの意味】
・人気スコア = 仕入れ量 − 売れ残り量
・プラスが大きい → 需要が高い
・マイナスが大きい → 売れ残りが多い

【人気スコア上位（積極的に使うべき要素）】
{top_text}

【売れ残り上位（避けるべき要素）】
{worst_text}

新商品を3つ提案してください。
必ず以下の形式で回答し、コロンは全角（：）を使ってください。

1. 商品名：○○
   ジャンル：○○
   キーワード：○○・○○
   根拠：（40字以内）
   ターゲット：（30字以内）
2.（同上）
3.（同上）"""

    proposal_response = bedrock.invoke_model(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": prompt}]
        })
    )
    proposal = json.loads(
        proposal_response["body"].read()
    )["content"][0]["text"]
    print(f"✅ 提案生成完了")
    print(f"=== 提案テキスト ===\n{proposal}")

    # =========================================
    # 4. 画像生成（全て揃ってから返す）
    # =========================================
    product_names = re.findall(r'商品名[：:](.+)', proposal)
    genres        = re.findall(r'ジャンル[：:](.+)', proposal)
    keywords      = re.findall(r'キーワード[：:](.+)', proposal)

    print(f"抽出された商品名: {product_names}")

    images = []
    for i, name in enumerate(product_names[:3]):
        genre   = genres[i]   if i < len(genres)   else ""
        keyword = keywords[i] if i < len(keywords) else ""

        # ✅ 60秒待機（レート制限対策）
        if i > 0:
            print(f"待機中...60秒（レート制限対策）")
            time.sleep(60)

        print(f"画像生成中 ({i+1}/3): {name}")
        base64_image = generate_image(name, genre, keyword)
        images.append({
            "product_name": name,
            "base64":       base64_image
        })

    print(f"✅ 全画像生成完了（{len(images)}件）")

    # =========================================
    # 5. 全て揃ってからレスポンスを返す
    # =========================================
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "date_from":    date_from,
            "date_to":      date_to,
            "top_trends":   top_trends,
            "worst_trends": worst_trends,
            "proposals":    proposal,
            "images":       images
        }, ensure_ascii=False, indent=2)
    }
