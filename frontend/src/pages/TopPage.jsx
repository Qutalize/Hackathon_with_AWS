export default function TopPage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>コンビニ在庫管理アプリ</h1>
      <div style={styles.buttonGroup}>
        <button style={styles.btn("#6366f1")} onClick={() => onNavigate("staff")}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4f46e5"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#6366f1"}
        >
          店員用
        </button>
        <button style={styles.btn("#10b981")} onClick={() => onNavigate("customer")}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#059669"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#10b981"}
        >
          顧客用
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
    display: "flex",
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
};
