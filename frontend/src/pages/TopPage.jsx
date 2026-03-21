export default function TopPage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>一石四鳥コンビニ在庫アプリ</h1>
      <div style={styles.buttonGroup}>
        <button
          style={styles.btn("#f87171")} 
          onClick={() => window.location.href = "https://prod.dlv6xelof2itp.amplifyapp.com/subscribe.html"}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4338ca"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#6366f1"}
        >
          在庫管理側
        </button>
        <button
          style={styles.btn("#6366f1")}
          onClick={() => onNavigate("staff")}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4f46e5"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#6366f1"}
        >
          店員用
        </button>
        <button
          style={styles.btn("#10b981")}
          onClick={() => onNavigate("customer")}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#059669"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#10b981"}
        >
          顧客用
        </button>
        <button
          style={styles.btn("#f59e0b")}
          onClick={() => onNavigate("product")}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#d97706"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f59e0b"}
        >
          商品開発側
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    gap: "48px",
  },
  title: {
    fontSize: "48px",
    fontWeight: "800",
    color: "#1a1a2e",
    textAlign: "center",
    margin: 0,
  },
  buttonGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  btn: (bg) => ({
    padding: "20px 56px",
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    backgroundColor: bg,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  }),
  btnDisabled: {
    padding: "20px 56px",
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    backgroundColor: "#9ca3af",
    border: "none",
    borderRadius: "12px",
    cursor: "not-allowed",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  },
};
