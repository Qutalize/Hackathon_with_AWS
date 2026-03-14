"""
SNS APIクライアントモジュール
YouTube, X(Twitter), Instagram からSNSデータを収集する。
DEMO_MODE=true の場合はサンプルデータを返す。
"""
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


# ============================================================
# サンプルデータ（デモモード用）
# ============================================================
SAMPLE_POSTS = [
    {
        "platform": "youtube",
        "post_id": "demo_yt_001",
        "text": "【コンビニ新商品】セブンイレブンの新作スイーツが神すぎる！もちもち食感のわらび餅がたまらない🍡 #コンビニスイーツ #セブンイレブン",
        "likes": 15200,
        "comments": 830,
        "shares": 2400,
        "views": 520000,
        "author": "グルメレビュアーTV",
        "published_at": "2026-03-12T10:00:00Z",
        "url": "https://youtube.com/watch?v=demo001",
    },
    {
        "platform": "youtube",
        "post_id": "demo_yt_002",
        "text": "ファミマの新作チキンが激ウマ！スパイシーチキンバーガーが最高すぎた件 #ファミマ #コンビニグルメ",
        "likes": 8900,
        "comments": 420,
        "shares": 1100,
        "views": 280000,
        "author": "食べログ太郎",
        "published_at": "2026-03-11T15:30:00Z",
        "url": "https://youtube.com/watch?v=demo002",
    },
    {
        "platform": "twitter",
        "post_id": "demo_tw_001",
        "text": "ローソンのバスチー新フレーバー食べた！ストロベリー味が期間限定で出てるの知ってた？めちゃくちゃ美味しい😍 #ローソン #バスチー #コンビニスイーツ",
        "likes": 4500,
        "comments": 320,
        "shares": 1800,
        "views": 95000,
        "author": "@sweets_lover",
        "published_at": "2026-03-13T08:20:00Z",
        "url": "https://x.com/sweets_lover/status/demo001",
    },
    {
        "platform": "twitter",
        "post_id": "demo_tw_002",
        "text": "セブンの金のハンバーグ弁当、リニューアルしてさらに美味しくなってるじゃん！これは在庫増やして欲しい #セブンイレブン #コンビニ弁当",
        "likes": 6200,
        "comments": 180,
        "shares": 950,
        "views": 72000,
        "author": "@bento_master",
        "published_at": "2026-03-13T12:45:00Z",
        "url": "https://x.com/bento_master/status/demo002",
    },
    {
        "platform": "twitter",
        "post_id": "demo_tw_003",
        "text": "ファミマのフラッペ新作、マンゴーフラッペが夏前に登場！もう3回リピートしてる🥭 #ファミマ #コンビニ新商品",
        "likes": 3200,
        "comments": 150,
        "shares": 800,
        "views": 45000,
        "author": "@drink_reviewer",
        "published_at": "2026-03-12T18:00:00Z",
        "url": "https://x.com/drink_reviewer/status/demo003",
    },
    {
        "platform": "instagram",
        "post_id": "demo_ig_001",
        "text": "セブンイレブンのもちもちクレープ🥞✨ 新作のティラミス味が神！カロリーは見ないふり😂 #コンビニスイーツ #セブンイレブン #新商品 #スイーツ好き",
        "likes": 12800,
        "comments": 560,
        "shares": 700,
        "views": 180000,
        "author": "@sweets_princess",
        "published_at": "2026-03-13T09:00:00Z",
        "url": "https://instagram.com/p/demo001",
    },
    {
        "platform": "instagram",
        "post_id": "demo_ig_002",
        "text": "ローソンの新作おにぎり、鮭ハラミが具沢山すぎて感動🍙 これは毎日買いたいレベル！ #ローソン #コンビニグルメ #おにぎり",
        "likes": 5600,
        "comments": 210,
        "shares": 320,
        "views": 67000,
        "author": "@onigiri_fan",
        "published_at": "2026-03-12T07:30:00Z",
        "url": "https://instagram.com/p/demo002",
    },
    {
        "platform": "youtube",
        "post_id": "demo_yt_003",
        "text": "【全部食べた】コンビニ3社の新作アイス対決！ハーゲンダッツ新作vsコンビニPBアイス！ #コンビニ新商品 #アイス #ハーゲンダッツ",
        "likes": 22000,
        "comments": 1200,
        "shares": 3800,
        "views": 780000,
        "author": "アイス大好きChannel",
        "published_at": "2026-03-10T20:00:00Z",
        "url": "https://youtube.com/watch?v=demo003",
    },
    {
        "platform": "twitter",
        "post_id": "demo_tw_004",
        "text": "セブンイレブンの冷凍パスタ、ボロネーゼが本格的すぎる。コンビニのレベルじゃない…。在庫少なくてなかなか買えない😭 #セブンイレブン #コンビニ飯",
        "likes": 8100,
        "comments": 390,
        "shares": 2100,
        "views": 110000,
        "author": "@pasta_addict",
        "published_at": "2026-03-13T19:30:00Z",
        "url": "https://x.com/pasta_addict/status/demo004",
    },
    {
        "platform": "instagram",
        "post_id": "demo_ig_003",
        "text": "ファミマのファミチキ、期間限定のチーズ味が出てるの！外カリ中ジューシーでチーズがとろ〜り🧀 #ファミチキ #ファミマ #コンビニ新商品",
        "likes": 9400,
        "comments": 430,
        "shares": 620,
        "views": 135000,
        "author": "@chicken_love",
        "published_at": "2026-03-11T12:15:00Z",
        "url": "https://instagram.com/p/demo003",
    },
]


# ============================================================
# YouTube Data API クライアント
# ============================================================
class YouTubeClient:
    """YouTube Data API v3 を使ったデータ収集クライアント"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._service = None

    def _get_service(self):
        if self._service is None:
            from googleapiclient.discovery import build
            self._service = build("youtube", "v3", developerKey=self.api_key)
        return self._service

    def search_videos(self, query: str, max_results: int = 50) -> list[dict[str, Any]]:
        """キーワードで動画を検索し、投稿データのリストを返す"""
        service = self._get_service()
        posts = []

        search_response = service.search().list(
            q=query,
            part="id,snippet",
            type="video",
            maxResults=min(max_results, 50),
            order="viewCount",
            publishedAfter=_days_ago_iso(7),
            relevanceLanguage="ja",
            regionCode="JP",
        ).execute()

        video_ids = [item["id"]["videoId"] for item in search_response.get("items", [])]
        if not video_ids:
            return posts

        stats_response = service.videos().list(
            part="statistics,snippet",
            id=",".join(video_ids),
        ).execute()

        for item in stats_response.get("items", []):
            snippet = item["snippet"]
            stats = item.get("statistics", {})
            posts.append({
                "platform": "youtube",
                "post_id": f"yt_{item['id']}",
                "text": f"{snippet.get('title', '')} {snippet.get('description', '')[:300]}",
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
                "shares": 0,
                "views": int(stats.get("viewCount", 0)),
                "author": snippet.get("channelTitle", ""),
                "published_at": snippet.get("publishedAt", ""),
                "url": f"https://youtube.com/watch?v={item['id']}",
            })

        return posts


# ============================================================
# X (Twitter) API クライアント
# ============================================================
class TwitterClient:
    """Twitter/X API v2 を使ったデータ収集クライアント"""

    def __init__(self, bearer_token: str):
        self.bearer_token = bearer_token
        self._client = None

    def _get_client(self):
        if self._client is None:
            import tweepy
            self._client = tweepy.Client(bearer_token=self.bearer_token)
        return self._client

    def search_recent(self, query: str, max_results: int = 50) -> list[dict[str, Any]]:
        """最近のツイートをハッシュタグ検索し、投稿データのリストを返す"""
        client = self._get_client()
        posts = []

        response = client.search_recent_tweets(
            query=f"{query} lang:ja -is:retweet",
            max_results=min(max_results, 100),
            tweet_fields=["created_at", "public_metrics", "author_id"],
            expansions=["author_id"],
        )

        if not response.data:
            return posts

        users = {u.id: u for u in (response.includes.get("users", []) or [])}

        for tweet in response.data:
            metrics = tweet.public_metrics or {}
            author = users.get(tweet.author_id)
            posts.append({
                "platform": "twitter",
                "post_id": f"tw_{tweet.id}",
                "text": tweet.text,
                "likes": metrics.get("like_count", 0),
                "comments": metrics.get("reply_count", 0),
                "shares": metrics.get("retweet_count", 0) + metrics.get("quote_count", 0),
                "views": metrics.get("impression_count", 0),
                "author": f"@{author.username}" if author else "",
                "published_at": tweet.created_at.isoformat() if tweet.created_at else "",
                "url": f"https://x.com/i/status/{tweet.id}",
            })

        return posts


# ============================================================
# Instagram Graph API クライアント
# ============================================================
class InstagramClient:
    """Instagram Graph API を使ったデータ収集クライアント"""

    BASE_URL = "https://graph.facebook.com/v19.0"

    def __init__(self, access_token: str, business_account_id: str):
        self.access_token = access_token
        self.business_account_id = business_account_id

    def search_hashtag(self, tag: str, max_results: int = 50) -> list[dict[str, Any]]:
        """ハッシュタグで投稿を検索し、投稿データのリストを返す"""
        import requests
        posts = []

        # ハッシュタグIDを取得
        tag_clean = tag.replace("#", "").replace("＃", "")
        tag_resp = requests.get(
            f"{self.BASE_URL}/ig_hashtag_search",
            params={
                "user_id": self.business_account_id,
                "q": tag_clean,
                "access_token": self.access_token,
            },
            timeout=30,
        )
        tag_data = tag_resp.json().get("data", [])
        if not tag_data:
            return posts

        hashtag_id = tag_data[0]["id"]

        # 最近の投稿を取得
        media_resp = requests.get(
            f"{self.BASE_URL}/{hashtag_id}/recent_media",
            params={
                "user_id": self.business_account_id,
                "fields": "id,caption,like_count,comments_count,timestamp,permalink",
                "access_token": self.access_token,
            },
            timeout=30,
        )
        media_data = media_resp.json().get("data", [])

        for item in media_data[:max_results]:
            posts.append({
                "platform": "instagram",
                "post_id": f"ig_{item['id']}",
                "text": item.get("caption", ""),
                "likes": item.get("like_count", 0),
                "comments": item.get("comments_count", 0),
                "shares": 0,
                "views": 0,
                "author": "",
                "published_at": item.get("timestamp", ""),
                "url": item.get("permalink", ""),
            })

        return posts


# ============================================================
# 統合コレクター
# ============================================================
class SNSCollector:
    """全プラットフォームからデータを収集する統合コレクター"""

    def __init__(self, config):
        self.config = config
        self.demo_mode = config.DEMO_MODE

    def collect_all(self, tags: list[str] | None = None) -> list[dict[str, Any]]:
        """
        全SNSプラットフォームからデータを収集する。
        DEMO_MODE=true の場合はサンプルデータを返す。
        """
        if self.demo_mode:
            logger.info("🎭 デモモード: サンプルデータを使用します")
            return SAMPLE_POSTS.copy()

        tags = tags or self.config.SEARCH_TAGS
        all_posts: list[dict[str, Any]] = []
        max_results = self.config.MAX_RESULTS_PER_PLATFORM

        # YouTube
        if self.config.YOUTUBE_API_KEY:
            try:
                yt = YouTubeClient(self.config.YOUTUBE_API_KEY)
                for tag in tags:
                    posts = yt.search_videos(tag, max_results=max_results)
                    all_posts.extend(posts)
                    logger.info(f"YouTube: '{tag}' で {len(posts)} 件取得")
            except Exception as e:
                logger.error(f"YouTube API エラー: {e}")

        # Twitter/X
        if self.config.TWITTER_BEARER_TOKEN:
            try:
                tw = TwitterClient(self.config.TWITTER_BEARER_TOKEN)
                for tag in tags:
                    posts = tw.search_recent(tag, max_results=max_results)
                    all_posts.extend(posts)
                    logger.info(f"Twitter: '{tag}' で {len(posts)} 件取得")
            except Exception as e:
                logger.error(f"Twitter API エラー: {e}")

        # Instagram
        if self.config.INSTAGRAM_ACCESS_TOKEN and self.config.INSTAGRAM_BUSINESS_ACCOUNT_ID:
            try:
                ig = InstagramClient(
                    self.config.INSTAGRAM_ACCESS_TOKEN,
                    self.config.INSTAGRAM_BUSINESS_ACCOUNT_ID,
                )
                for tag in tags:
                    posts = ig.search_hashtag(tag, max_results=max_results)
                    all_posts.extend(posts)
                    logger.info(f"Instagram: '{tag}' で {len(posts)} 件取得")
            except Exception as e:
                logger.error(f"Instagram API エラー: {e}")

        if not all_posts:
            logger.warning("⚠️ API からデータを取得できませんでした。サンプルデータにフォールバックします。")
            return SAMPLE_POSTS.copy()

        # 重複除去
        seen_ids = set()
        unique_posts = []
        for post in all_posts:
            if post["post_id"] not in seen_ids:
                seen_ids.add(post["post_id"])
                unique_posts.append(post)

        logger.info(f"✅ 合計 {len(unique_posts)} 件のユニーク投稿を収集しました")
        return unique_posts


# ============================================================
# ヘルパー関数
# ============================================================
def _days_ago_iso(days: int) -> str:
    """N日前のISO 8601形式の日時文字列を返す"""
    from datetime import timedelta
    dt = datetime.now(timezone.utc) - timedelta(days=days)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
