import sys
import json
import boto3
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import udf, col, concat, lit, lpad, split, regexp_replace
from pyspark.sql.types import StringType

args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# =========================================
# 1. キーワード抽出関数
# =========================================
def extract_keywords_via_bedrock(product_name):
    import boto3
    import json

    if product_name is None:
        return "その他|その他"

    bedrock = boto3.client(
        service_name="bedrock-runtime",
        region_name="us-east-1"
    )

    prompt = f"""以下の商品名から、需要予測の機械学習に役立つ特徴キーワードを2つだけ抽出してください。

商品名: {product_name}

ルール:
- キーワードは日本語で2〜6文字程度の簡潔な単語にする
- 味・素材・健康機能・カテゴリ・ターゲット層などの観点から抽出する
- 必ずキーワードを2つ返す
- 出力形式は「キーワード1|キーワード2」のみ。説明文は一切不要。

例:
イチゴのショートケーキ → フルーツ系|スイーツ
ダイエットコーラ → ヘルシー|炭酸系
グルテンフリーパスタ → ヘルシー|麺系"""

    try:
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-haiku-20240307-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 50,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        result   = json.loads(response["body"].read())
        keywords = result["content"][0]["text"].strip()

        if "|" not in keywords:
            keywords = f"{keywords}|その他"

        return keywords

    except Exception as e:
        print(f"[BEDROCK_ERROR] '{product_name}' {type(e).__name__}: {str(e)}")
        return "その他|その他"

extract_keywords_udf = udf(extract_keywords_via_bedrock, StringType())

# =========================================
# 2. データ読み込み
# =========================================
TABLE_F1 = "function1"
TABLE_F2 = "function2"

print(f"読み込むテーブル: {TABLE_F1}, {TABLE_F2}")

df_f1 = glueContext.create_dynamic_frame.from_catalog(
    database="inventory_db",
    table_name=TABLE_F1
).toDF()

df_f2 = glueContext.create_dynamic_frame.from_catalog(
    database="inventory_db",
    table_name=TABLE_F2
).toDF()

print(f"f1 読み込み件数: {df_f1.count()}, カラム: {df_f1.columns}")
print(f"f2 読み込み件数: {df_f2.count()}, カラム: {df_f2.columns}")

# =========================================
# 2.5 カラム正規化
# =========================================

def normalize_f1(df):
    """
    function1（入荷データ）の正規化
    stock_quantity → stock_delta（正の値のまま）
    """
    # stock_quantity を stock_delta に変換（正の値のまま）
    if "stock_quantity" in df.columns:
        df = df.withColumn(
            "stock_delta",
            col("stock_quantity").cast("double")
        ).drop("stock_quantity")

    # product_id が不要な場合は削除
    if "product_id" in df.columns:
        df = df.drop("product_id")

    return df

def normalize_f2(df):
    """
    function2（消費データ）の正規化
    ① category       → genre
    ② expiration_date → expiry_date
    ③ 日付形式        → 2026/03/17 を 2026-03-17 に統一
    ④ stock_quantity  → stock_delta（負の値に変換）
    ⑤ 不要カラムを削除
    """
    # ① category → genre
    if "category" in df.columns:
        df = df.withColumnRenamed("category", "genre")

    # ② expiration_date → expiry_date
    if "expiration_date" in df.columns:
        df = df.withColumnRenamed("expiration_date", "expiry_date")

    # ③ 日付形式を統一（/ → -）
    if "expiry_date" in df.columns:
        df = df.withColumn(
            "expiry_date",
            regexp_replace(col("expiry_date"), "/", "-")
        )

    # ④ stock_quantity → stock_delta（負の値に変換）
    if "stock_quantity" in df.columns:
        df = df.withColumn(
            "stock_delta",
            col("stock_quantity").cast("double") * -1
        ).drop("stock_quantity")

    # ⑤ 不要な新規カラムを削除
    for c in ["StoreID", "confidence_score", "created_at", "SSID", "product_id"]:
        if c in df.columns:
            df = df.drop(c)

    return df

df_f1 = normalize_f1(df_f1)
df_f2 = normalize_f2(df_f2)

print(f"f1 正規化後カラム: {df_f1.columns}")
print(f"f2 正規化後カラム: {df_f2.columns}")
df_f1.show(3, truncate=False)
df_f2.show(3, truncate=False)

# =========================================
# 3. data_date 列を追加して year/month/day を削除
# =========================================
def add_date_column(df):
    return df \
        .withColumn("data_date",
            concat(
                col("year").cast("string"), lit("-"),
                lpad(col("month").cast("string"), 2, "0"), lit("-"),
                lpad(col("day").cast("string"),   2, "0")
            )
        ) \
        .drop("year", "month", "day")

df_f1_clean = add_date_column(df_f1)
df_f2_clean = add_date_column(df_f2)

# =========================================
# 4. 結合
# =========================================
df_merged = df_f1_clean.unionByName(df_f2_clean, allowMissingColumns=True)
print(f"結合後件数: {df_merged.count()}, カラム: {df_merged.columns}")

# =========================================
# 5. キーワード抽出
# =========================================
df_unique = df_merged.select("product_name").distinct()
df_unique_with_kw = df_unique.withColumn(
    "keywords_raw", extract_keywords_udf(col("product_name"))
)

df_with_keywords = df_merged.join(
    df_unique_with_kw, on="product_name", how="left"
)

df_final = df_with_keywords \
    .withColumn("keyword_1", split(col("keywords_raw"), "\\|")[0]) \
    .withColumn("keyword_2", split(col("keywords_raw"), "\\|")[1]) \
    .drop("keywords_raw") \
    .drop("expiry_date")   # 機械学習に不要なため削除

# =========================================
# 6. 確認ログ
# =========================================
print(f"最終件数: {df_final.count()}")
print(f"最終カラム: {df_final.columns}")
df_final.show(5, truncate=False)

# =========================================
# 7. Parquet出力
# =========================================
OUTPUT_PATH = "s3://all-918375630428-ap-northeast-1-an/processed/training_data/"
df_final.write.mode("overwrite").parquet(OUTPUT_PATH)

job.commit()
print("Job completed successfully.")
