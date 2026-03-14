"""
LLM クライアントモジュール（生成AI統合版）
Google Gemini API を使用して以下を実行する:
  1. SNSテキストの感情分析（Bedrock代替）
  2. コンビニ商品名の抽出
DEMO_MODE の場合はルールベースの簡易処理を行う。
"""
import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


# ============================================================
# デモ用辞書・ルールベース
# ============================================================
_KNOWN_PRODUCTS = {
    "わらび餅": {"product_name": "もちもちわらび餅", "genre": "スイーツ", "store": "セブンイレブン"},
    "チキンバーガー": {"product_name": "スパイシーチキンバーガー", "genre": "ホットスナック", "store": "ファミリーマート"},
    "バスチー": {"product_name": "バスチー バスク風チーズケーキ", "genre": "スイーツ", "store": "ローソン"},
    "ストロベリー": {"product_name": "バスチー ストロベリー", "genre": "スイーツ", "store": "ローソン"},
    "ハンバーグ弁当": {"product_name": "金のハンバーグ弁当", "genre": "弁当", "store": "セブンイレブン"},
    "金のハンバーグ": {"product_name": "金のハンバーグ弁当", "genre": "弁当", "store": "セブンイレブン"},
    "フラッペ": {"product_name": "マンゴーフラッペ", "genre": "ドリンク", "store": "ファミリーマート"},
    "マンゴー": {"product_name": "マンゴーフラッペ", "genre": "ドリンク", "store": "ファミリーマート"},
    "クレープ": {"product_name": "もちもちクレープ ティラミス味", "genre": "スイーツ", "store": "セブンイレブン"},
    "ティラミス": {"product_name": "もちもちクレープ ティラミス味", "genre": "スイーツ", "store": "セブンイレブン"},
    "鮭ハラミ": {"product_name": "鮭ハラミおにぎり", "genre": "おにぎり", "store": "ローソン"},
    "おにぎり": {"product_name": "鮭ハラミおにぎり", "genre": "おにぎり", "store": "ローソン"},
    "アイス": {"product_name": "コンビニPBアイス", "genre": "アイス", "store": "各社"},
    "ハーゲンダッツ": {"product_name": "ハーゲンダッツ 新作", "genre": "アイス", "store": "各社"},
    "ボロネーゼ": {"product_name": "冷凍ボロネーゼパスタ", "genre": "冷凍食品", "store": "セブンイレブン"},
    "冷凍パスタ": {"product_name": "冷凍ボロネーゼパスタ", "genre": "冷凍食品", "store": "セブンイレブン"},
    "ファミチキ": {"product_name": "ファミチキ チーズ味", "genre": "ホットスナック", "store": "ファミリーマート"},
}

_POSITIVE_KEYWORDS = [
    "美味しい", "うまい", "激ウマ", "神", "最高", "感動", "好き", "リピート",
    "おすすめ", "たまらない", "幸せ", "絶品", "本格的", "ハマる", "やばい",
    "😍", "🥰", "✨", "😊", "👍", "🎉", "❤️", "💕",
]
_NEGATIVE_KEYWORDS = [
    "まずい", "不味い", "微妙", "残念", "がっかり", "ひどい", "最悪",
    "高い", "小さい", "少ない", "😭", "💢", "👎",
]


def _demo_analyze(text: str) -> dict[str, Any]:
    """デモ用: ルールベースで感情分析 + 商品名抽出を同時に行う"""
    # --- 感情分析 ---
    text_lower = text.lower()
    pos_count = sum(1 for kw in _POSITIVE_KEYWORDS if kw in text_lower)
    neg_count = sum(1 for kw in _NEGATIVE_KEYWORDS if kw in text_lower)
    total = pos_count + neg_count + 1
    pos_score = round(pos_count / total, 4)
    neg_score = round(neg_count / total, 4)

    if pos_score > neg_score and pos_score > 0.3:
        sentiment = "POSITIVE"
    elif neg_score > pos_score and neg_score > 0.3:
        sentiment = "NEGATIVE"
    elif pos_count > 0 and neg_count > 0:
        sentiment = "MIXED"
    else:
        sentiment = "NEUTRAL"

    # --- 商品名抽出 ---
    product_name = "不明な商品"
    genre = "その他"
    store = "不明"
    confidence = 0.1

    for keyword, info in _KNOWN_PRODUCTS.items():
        if keyword in text:
            product_name = info["product_name"]
            genre = info["genre"]
            store = info["store"]
            confidence = 0.85
            break

    return {
        "sentiment": sentiment,
        "sentiment_scores": {
            "positive": pos_score,
            "negative": neg_score,
            "neutral": round(max(1.0 - pos_score - neg_score, 0), 4),
        },
        "product_name": product_name,
        "genre": genre,
        "store": store,
        "product_confidence": confidence,
    }


# ============================================================
# Gemini API クライアント
# ============================================================
class LLMClient:
    """
    Google Gemini API を使った感情分析・商品名抽出クライアント。
    将来的に Bedrock に置き換え予定（ハッカソン当日）。
    """

    # 感情分析 + 商品名抽出を1回のAPI呼び出しで行うプロンプト
    ANALYSIS_PROMPT = """あなたはコンビニ商品のSNS分析の専門家です。
以下のSNS投稿テキストを分析し、感情と商品情報を抽出してください。

# 入力テキスト
{text}

# 出力形式（JSON）
以下のJSON形式で必ず回答してください。説明文は不要です。JSONのみ返してください。
{{
    "sentiment": "POSITIVE" または "NEGATIVE" または "NEUTRAL" または "MIXED",
    "sentiment_scores": {{
        "positive": 0.0～1.0,
        "negative": 0.0～1.0,
        "neutral": 0.0～1.0
    }},
    "product_name": "商品の正式名称（推測でOK）",
    "genre": "スイーツ|弁当|おにぎり|ホットスナック|ドリンク|冷凍食品|カップ麺|パン|アイス|その他",
    "store": "セブンイレブン|ファミリーマート|ローソン|各社|不明",
    "product_confidence": 0.0～1.0の確信度
}}
"""

    def __init__(self, api_key: str = "", demo_mode: bool = False):
        self.api_key = api_key
        self.demo_mode = demo_mode
        self._model = None

    def _get_model(self):
        if self._model is None:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel("gemini-2.0-flash")
        return self._model

    def analyze(self, text: str) -> dict[str, Any]:
        """
        感情分析 + 商品名抽出を1回のAPI呼び出しで行う。
        Bedrock (Comprehend) の代替として機能する。

        Returns:
            {
                "sentiment": "POSITIVE"|"NEGATIVE"|"NEUTRAL"|"MIXED",
                "sentiment_scores": {"positive": float, "negative": float, "neutral": float},
                "product_name": str,
                "genre": str,
                "store": str,
                "product_confidence": float,
            }
        """
        if self.demo_mode:
            return _demo_analyze(text)

        try:
            model = self._get_model()
            prompt = self.ANALYSIS_PROMPT.format(text=text)
            response = model.generate_content(prompt)

            response_text = response.text.strip()
            json_match = re.search(r"```(?:json)?\s*(.*?)\s*```", response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)

            result = json.loads(response_text)

            return {
                "sentiment": result.get("sentiment", "NEUTRAL"),
                "sentiment_scores": result.get("sentiment_scores", {
                    "positive": 0.5, "negative": 0.0, "neutral": 0.5,
                }),
                "product_name": result.get("product_name", "不明な商品"),
                "genre": result.get("genre", "その他"),
                "store": result.get("store", "不明"),
                "product_confidence": float(result.get("product_confidence", 0.5)),
            }

        except Exception as e:
            logger.error(f"Gemini API エラー: {e}")
            return _demo_analyze(text)

    def batch_analyze(self, texts: list[str]) -> list[dict[str, Any]]:
        """複数テキストの感情分析 + 商品名抽出をバッチで行う。"""
        results = []
        for text in texts:
            result = self.analyze(text)
            results.append(result)
        return results

    # --- 旧API互換 ---
    def extract_product(self, text: str) -> dict[str, Any]:
        """後方互換: analyze() の商品情報部分のみ返す"""
        result = self.analyze(text)
        return {
            "product_name": result["product_name"],
            "genre": result["genre"],
            "store": result["store"],
            "confidence": result["product_confidence"],
        }

    def analyze_sentiment(self, text: str) -> dict[str, Any]:
        """後方互換: analyze() の感情分析部分のみ返す"""
        result = self.analyze(text)
        return {
            "Sentiment": result["sentiment"],
            "SentimentScore": {
                "Positive": result["sentiment_scores"].get("positive", 0),
                "Negative": result["sentiment_scores"].get("negative", 0),
                "Neutral": result["sentiment_scores"].get("neutral", 0),
                "Mixed": 0.0,
            },
        }
