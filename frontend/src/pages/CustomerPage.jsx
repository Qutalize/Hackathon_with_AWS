import { useState } from "react";

const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL;

async function searchNearbyConvenienceStores(lat, lng) {
  const res = await fetch(SEARCH_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`API ${res.status}: ${errorData.error}`);
  }

  const data = await res.json();
  return data.stores ?? [];
}

const COLOR = {
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryLight: "#dcfce7",
  primaryMid: "#86efac",
  accent: "#15803d",
  bg: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
  card: "#ffffff",
  border: "#bbf7d0",
  borderMid: "#86efac",
  muted: "#6b7280",
  text: "#14532d",
  textSub: "#166534",
  textBody: "#374151",
  error: "#ef4444",
  errorLight: "#fef2f2",
  errorBorder: "#fecaca",
};

const styles = {
  container: {
    minHeight: "100vh",
    background: COLOR.bg,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "32px 16px",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: COLOR.card,
    borderRadius: "20px",
    boxShadow: "0 8px 40px rgba(34,197,94,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "480px",
    boxSizing: "border-box",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    marginBottom: "20px",
    background: "none",
    border: "none",
    color: COLOR.muted,
    cursor: "pointer",
    fontSize: "13px",
    padding: "4px 0",
    transition: "color 0.2s",
  },
  header: {
    textAlign: "center",
    marginBottom: "28px",
  },
  badge: {
    display: "inline-block",
    backgroundColor: COLOR.primaryLight,
    color: COLOR.accent,
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    padding: "3px 12px",
    borderRadius: "999px",
    marginBottom: "10px",
    border: `1px solid ${COLOR.border}`,
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: COLOR.text,
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "13px",
    color: COLOR.muted,
    margin: 0,
  },
  searchBtn: {
    width: "100%",
    padding: "14px",
    background: `linear-gradient(135deg, ${COLOR.primary} 0%, ${COLOR.primaryDark} 100%)`,
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    letterSpacing: "0.02em",
    boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
  },
  searchBtnDisabled: {
    background: "#d1fae5",
    color: "#6b7280",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  locationBox: {
    marginTop: "20px",
    backgroundColor: COLOR.primaryLight,
    borderRadius: "12px",
    padding: "14px 18px",
    border: `1px solid ${COLOR.border}`,
  },
  locationLabel: {
    fontSize: "11px",
    color: COLOR.accent,
    fontWeight: "700",
    letterSpacing: "0.06em",
    marginBottom: "6px",
  },
  coord: {
    fontSize: "13px",
    color: COLOR.textSub,
    margin: "2px 0",
    fontFamily: "monospace",
  },
  divider: {
    height: "1px",
    backgroundColor: COLOR.border,
    margin: "24px 0",
  },
  storeCount: {
    fontSize: "13px",
    fontWeight: "700",
    color: COLOR.textSub,
    marginBottom: "14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  storeCard: {
    backgroundColor: "#f9fffe",
    border: `1px solid ${COLOR.border}`,
    borderRadius: "14px",
    padding: "16px 18px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(34,197,94,0.07)",
  },
  storeHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  storeName: {
    fontSize: "15px",
    fontWeight: "700",
    color: COLOR.text,
    margin: 0,
  },
  storeDistance: {
    fontSize: "12px",
    fontWeight: "700",
    color: COLOR.primary,
    backgroundColor: COLOR.primaryLight,
    padding: "2px 10px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  productList: {
    marginTop: "12px",
    borderTop: `1px solid ${COLOR.border}`,
    paddingTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  productItem: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    border: `1px solid ${COLOR.border}`,
    borderRadius: "8px",
    padding: "8px 12px",
  },
  productName: {
    fontSize: "13px",
    fontWeight: "700",
    color: COLOR.textBody,
    marginBottom: "3px",
  },
  productMeta: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  productExpiry: {
    fontSize: "11px",
    color: "#dc2626",
    fontWeight: "600",
  },
  productStock: {
    fontSize: "11px",
    color: COLOR.muted,
  },
  noResult: {
    marginTop: "20px",
    color: COLOR.muted,
    fontSize: "14px",
    textAlign: "center",
    padding: "24px",
    backgroundColor: COLOR.primaryLight,
    borderRadius: "12px",
    border: `1px dashed ${COLOR.borderMid}`,
  },
  error: {
    marginTop: "16px",
    color: "#dc2626",
    fontSize: "13px",
    backgroundColor: COLOR.errorLight,
    border: `1px solid ${COLOR.errorBorder}`,
    borderRadius: "10px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
};

export default function CustomerPage({ onNavigate }) {
  const [location, setLocation] = useState(null);
  const [stores, setStores] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報をサポートしていません");
      return;
    }
    setLoading(true);
    setError(null);
    setStores(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        try {
          const results = await searchNearbyConvenienceStores(lat, lng);
          setStores(results);
        } catch (e) {
          setError("コンビニ検索に失敗しました: " + e.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("位置情報の取得に失敗しました: " + err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => onNavigate("top")}>
          ← トップに戻る
        </button>

        <div style={styles.header}>
          <div style={styles.badge}>顧客向け</div>
          <h2 style={styles.title}>近くのコンビニを探す</h2>
          <p style={styles.subtitle}>現在地から半径1km以内の在庫情報を表示します</p>
        </div>

        <button
          style={{
            ...styles.searchBtn,
            ...(loading ? styles.searchBtnDisabled : {}),
          }}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "🔍 検索中..." : "📍 現在地でコンビニを検索"}
        </button>

        {location && (
          <div style={styles.locationBox}>
            <div style={styles.locationLabel}>📌 現在地</div>
            <div style={styles.coord}>緯度：{location.lat.toFixed(6)}</div>
            <div style={styles.coord}>経度：{location.lng.toFixed(6)}</div>
          </div>
        )}

        {stores !== null && (
          <>
            <div style={styles.divider} />
            {stores.length === 0 ? (
              <div style={styles.noResult}>
                🏪 半径1km以内にコンビニが見つかりませんでした
              </div>
            ) : (
              <>
                <div style={styles.storeCount}>
                  <span>🏪</span>
                  <span>半径1km以内のコンビニ（{stores.length}件）</span>
                </div>
                {stores.map((store, i) => (
                  <div key={store.store_id ?? i} style={styles.storeCard}>
                    <div style={styles.storeHeader}>
                      <p style={styles.storeName}>{store.store_name}</p>
                      {store.distance != null && (
                        <span style={styles.storeDistance}>
                          約 {Math.round(store.distance)} m
                        </span>
                      )}
                    </div>
                    {store.products && store.products.length > 0 && (
                      <div style={styles.productList}>
                        {store.products.map((p, j) => (
                          <div key={j} style={styles.productItem}>
                            <span style={styles.productName}>{p.product_name}</span>
                            <div style={styles.productMeta}>
                              <span style={styles.productExpiry}>
                                期限：{p.expiration_date}
                                {p.days_remaining < 0
                                  ? "（期限切れ）"
                                  : p.days_remaining === 0
                                  ? "（本日）"
                                  : `（残り${p.days_remaining}日）`}
                              </span>
                              <span style={styles.productStock}>
                                在庫：{p.stock_quantity}個
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {error && (
          <div style={styles.error}>
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
