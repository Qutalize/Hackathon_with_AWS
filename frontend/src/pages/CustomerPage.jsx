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
        maximumAge: 0
      }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => onNavigate("top")}>
          ← トップに戻る
        </button>
        <h2 style={styles.title}>顧客用ページ</h2>

        <button style={styles.locationBtn} onClick={handleSearch} disabled={loading}>
          {loading ? "検索中..." : "近くのコンビニを探す"}
        </button>

        {location && (
          <div style={styles.locationInfo}>
            <p style={styles.locationLabel}>現在地</p>
            <p style={styles.coord}>緯度: {location.lat.toFixed(6)}</p>
            <p style={styles.coord}>経度: {location.lng.toFixed(6)}</p>
          </div>
        )}

        {stores !== null && stores.length === 0 && (
          <p style={styles.noResult}>半径1km以内にコンビニが見つかりませんでした</p>
        )}

        {stores !== null && stores.length > 0 && (
          <div style={styles.storeSection}>
            <p style={styles.storeCount}>半径1km以内のコンビニ（{stores.length}件）</p>
            {stores.map((store, i) => (
              <div key={store.store_id ?? i} style={styles.storeCard}>
                <p style={styles.storeName}>{store.store_name}</p>
                {store.distance != null && (
                  <p style={styles.storeDistance}>約 {Math.round(store.distance)} m</p>
                )}
                {store.products && store.products.length > 0 && (
                  <div style={styles.productList}>
                    {store.products.map((p, j) => (
                      <div key={j} style={styles.productItem}>
                        <span style={styles.productName}>{p.product_name}</span>
                        <span style={styles.productExpiry}>
                          期限: {p.expiration_date}
                          {p.days_remaining <= 0
                            ? "（期限切れ）"
                            : p.days_remaining === 0
                            ? "（本日）"
                            : `（残り${p.days_remaining}日）`}
                        </span>
                        <span style={styles.productStock}>在庫: {p.stock_quantity}個</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "24px 0",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    padding: "40px",
    width: "100%",
    maxWidth: "480px",
    textAlign: "center",
  },
  backBtn: {
    display: "block",
    marginBottom: "16px",
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
    textAlign: "left",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: "24px",
  },
  locationBtn: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
  },
  locationInfo: {
    marginTop: "20px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    padding: "12px 16px",
    border: "1px solid #bae6fd",
    textAlign: "left",
  },
  locationLabel: {
    fontSize: "12px",
    color: "#0369a1",
    fontWeight: "600",
    marginBottom: "4px",
  },
  coord: {
    fontSize: "13px",
    color: "#1a1a2e",
    margin: "2px 0",
    fontFamily: "monospace",
  },
  storeSection: {
    marginTop: "24px",
    textAlign: "left",
  },
  storeCount: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "12px",
  },
  storeCard: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "8px",
  },
  storeName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a1a2e",
    margin: "0 0 4px 0",
  },
  storeDistance: {
    fontSize: "13px",
    color: "#3b82f6",
    margin: "0 0 2px 0",
  },
  storeAddress: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  productList: {
    marginTop: "8px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "8px",
  },
  productItem: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "6px",
    backgroundColor: "#fff7ed",
    borderRadius: "4px",
    padding: "6px 8px",
  },
  productName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a1a2e",
  },
  productExpiry: {
    fontSize: "12px",
    color: "#dc2626",
    margin: "2px 0",
  },
  productStock: {
    fontSize: "12px",
    color: "#6b7280",
  },
  noResult: {
    marginTop: "20px",
    color: "#6b7280",
    fontSize: "14px",
  },
  error: {
    marginTop: "16px",
    color: "#dc2626",
    fontSize: "14px",
  },
};