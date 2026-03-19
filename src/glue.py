import boto3
import json
# print("=== 推論プロファイル一覧取得 ===")

# try:
#     bedrock_mgmt = boto3.client(
#         service_name="bedrock",
#         region_name="ap-northeast-1"
#     )

#     response = bedrock_mgmt.list_inference_profiles()

#     for profile in response["inferenceProfileSummaries"]:
#         # haiku を含むものだけ表示
#         if "haiku" in profile["inferenceProfileId"].lower():
#             print(f"プロファイルID : {profile['inferenceProfileId']}")
#             print(f"名前           : {profile['inferenceProfileName']}")
#             print(f"ステータス     : {profile['status']}")
#             print("---")

# except Exception as e:
#     print(f"❌ {type(e).__name__}: {str(e)}")

# print("=== 取得終了 ===")



# print("=== Bedrock接続テスト開始 ===")

# try:
#     bedrock_test = boto3.client(
#         service_name="bedrock-runtime",
#         region_name="ap-northeast-1"
#     )
#     print("✅ クライアント生成：成功")

#     # ✅ InvokeModel → Converse API に変更
#     response = bedrock_test.converse(
#         modelId="apac.anthropic.claude-3-haiku-20240307-v1:0",
#         messages=[
#             {"role": "user", "content": [
#                 {"text": "テスト。「成功|テスト」とだけ返してください"}
#             ]}
#         ]
#     )
#     result = response["output"]["message"]["content"][0]["text"]
#     print(f"✅ Bedrock応答：{result}")

# except Exception as e:
#     print(f"❌ エラー種別：{type(e).__name__}")
#     print(f"❌ エラー詳細：{str(e)}")

# print("=== Bedrock接続テスト終了 ===")


import sys
import json
import boto3
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import udf, col
from pyspark.sql.types import StringType

## 初期化
args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# =========================================
# 1. Bedrock クライアントの準備
# =========================================
bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name="ap-northeast-1"
)

# =========================================
# 2. キーワード抽出関数
# =========================================
def extract_keywords_via_bedrock(product_name):
    import boto3
    import json

    if product_name is None:
        return "その他|その他"

    bedrock = boto3.client(
        service_name="bedrock-runtime",
        region_name="ap-northeast-1"
    )

    prompt = f"""以下の商品名から、需要予測の機械学習に役立つ特徴キーワードを2つだけ抽出してください。

商品名: {product_name}

ルール:
- キーワードは日本語で2〜6文字程度の簡潔な単語にする
- 味・素材・健康機能・カテゴリ・ターゲット層などの観点から抽出する
- 必ずキーワードを2つ返す
- 出力形式は「キーワード1|キーワード2」のみ。説明文は一切不要。

例:
イチゴのショートケーキ → フルーツ|スイーツ
ダイエットコーラ → ヘルシー|炭酸
グルテンフリーパスタ → ヘルシー|麺系"""

    try:
        response = bedrock.invoke_model(
            modelId="apac.anthropic.claude-3-haiku-20240307-v1:0",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 50,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        result = json.loads(response["body"].read())
        keywords = result["content"][0]["text"].strip()

        if "|" not in keywords:
            keywords = f"{keywords}|その他"

        return keywords

    except Exception as e:
        # ✅ 変更2：エラー内容を詳細にログ出力
        print(f"[BEDROCK_ERROR] 商品名='{product_name}' エラー種別={type(e).__name__} 詳細={str(e)}")
        return "その他|その他"

extract_keywords_udf = udf(extract_keywords_via_bedrock, StringType())
# =========================================
# 3. データ読み込み・結合
# =========================================
df_f1 = glueContext.create_dynamic_frame.from_catalog(
    database="inventory_db",
    table_name="function1"
).toDF()

df_f2 = glueContext.create_dynamic_frame.from_catalog(
    database="inventory_db",
    table_name="function2"
).toDF()

drop_cols = ["year", "month", "day"]
df_f1_clean = df_f1.drop(*drop_cols)
df_f2_clean = df_f2.drop(*drop_cols)

df_merged = df_f1_clean.unionByName(df_f2_clean, allowMissingColumns=True)

# =========================================
# 4. Bedrockでキーワード自動抽出
#    ユニーク商品名だけ抽出→Bedrock呼び出し→結合
#    （同じ商品名で何度もAPIを呼ばないための最適化）
# =========================================
from pyspark.sql.functions import split

# ユニーク商品名だけ取り出してキーワード付与
df_unique = df_merged.select("product_name").distinct()
df_unique_with_kw = df_unique.withColumn(
    "keywords_raw", extract_keywords_udf(col("product_name"))
)

# 元データに結合
df_with_keywords = df_merged.join(df_unique_with_kw, on="product_name", how="left")

df_final = df_with_keywords \
    .withColumn("keyword_1", split(col("keywords_raw"), "\\|")[0]) \
    .withColumn("keyword_2", split(col("keywords_raw"), "\\|")[1]) \
    .drop("keywords_raw")

# =========================================
# 5. 確認ログ
# =========================================
print(f"合計件数: {df_final.count()}")
df_final.select("product_name", "genre", "stock_delta", "keyword_1", "keyword_2") \
    .show(10, truncate=False)

# =========================================
# 6. Parquet出力
#    expiry_date は機械学習に不要なため削除
# =========================================
df_final = df_final.drop("expiry_date")  # ✅ 変更3：ここを追加

OUTPUT_PATH = "s3://{bucket}/processed/training_data/"
df_final.write.mode("overwrite").parquet(OUTPUT_PATH)

job.commit()
print("Job completed successfully.")
