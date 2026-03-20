import { useState } from "react";

export default function CustomerPage({ onNavigate }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報をサポートしていません");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError("位置情報の取得に失敗しました: " + err.message);
        setLoading(false);
      }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => onNavigate("top")}>← トップに戻る</button>
        <h2 style={styles.title}>顧客用ページ</h2>

        <button style={styles.locationBtn} onClick={getLocation} disabled={loading}>
          {loading ? "取得中..." : "現在地を取得する"}
        </button>

        {location && (
          <div style={styles.result}>
            <p style={styles.resultLabel}>現在地</p>
            <p style={styles.coord}>緯度: {location.lat.toFixed(6)}</p>
            <p style={styles.coord}>経度: {location.lng.toFixed(6)}</p>
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
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
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
  result: {
    marginTop: "24px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #bae6fd",
  },
  resultLabel: {
    fontSize: "13px",
    color: "#0369a1",
    fontWeight: "600",
    marginBottom: "8px",
  },
  coord: {
    fontSize: "15px",
    color: "#1a1a2e",
    margin: "4px 0",
    fontFamily: "monospace",
  },
  error: {
    marginTop: "16px",
    color: "#dc2626",
    fontSize: "14px",
  },
};
