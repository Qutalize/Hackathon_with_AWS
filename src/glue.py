import sys
import json
import boto3
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import udf, col, concat, lit, lpad, split
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

print(f"f1件数: {df_f1.count()}, f2件数: {df_f2.count()}")

# =========================================
# 3. data_date 列を追加して year/month/day を削除
#    期間フィルタ用に日付を保持
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

df_merged = df_f1_clean.unionByName(df_f2_clean, allowMissingColumns=True)

# =========================================
# 4. キーワード抽出
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
    .drop("expiry_date")

# =========================================
# 5. 確認ログ
# =========================================
print(f"最終件数: {df_final.count()}")
print(f"カラム: {df_final.columns}")
df_final.show(5, truncate=False)

# =========================================
# 6. Parquet出力
#    集計せず個別レコードのまま出力
#    data_date を保持して期間フィルタを有効化
# =========================================
OUTPUT_PATH = "s3://all-918375630428-ap-northeast-1-an/processed/training_data/"

df_final.write.mode("overwrite").parquet(OUTPUT_PATH)

job.commit()
print("Job completed successfully.")
