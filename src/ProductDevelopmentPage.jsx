import { useState, useRef } from "react";

const API_URL = import.meta.env.VITE_LAMBDA_URL;

const LOADING_MESSAGES = [
  "⏳ データを分析中...",
  "⏳ 新商品を考案中...",
  "⏳ 商品画像を生成中...",
  "⏳ もうすぐ完成です...",
];

export default function ProductDevelopmentPage({ onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = today.slice(0, 8) + "01";

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(today);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [status, setStatus] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [topTrends, setTopTrends] = useState([]);
  const [worstTrends, setWorstTrends] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  const intervalRef = useRef(null);

  const startLoadingMessages = () => {
    let index = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    intervalRef.current = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[index]);
    }, 8000);
  };

  const stopLoadingMessages = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const parseProposals = (proposalText) => {
    return proposalText.split(/\n(?=\d+\.)/).filter((b) => b.trim()).map((block) => ({
      name:    (block.match(/商品名：(.+)/)    || [])[1] || "",
      genre:   (block.match(/ジャンル：(.+)/)  || [])[1] || "",
      keyword: (block.match(/キーワード：(.+)/)|| [])[1] || "",
      basis:   (block.match(/根拠：(.+)/)      || [])[1] || "",
      target:  (block.match(/ターゲット：(.+)/)|| [])[1] || "",
    }));
  };

  const getProposal = async () => {
    if (!dateFrom || !dateTo) { alert("開始日と終了日を選択してください"); return; }
    if (dateFrom > dateTo)    { alert("開始日は終了日より前に設定してください"); return; }

    setLoading(true);
    setStatus("");
    setPeriodLabel("");
    setTopTrends([]);
    setWorstTrends([]);
    setProposals([]);
    setImages([]);
    setError("");
    startLoadingMessages();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_from: dateFrom, date_to: dateTo }),
      });

      const rawText = await res.text();
      if (!res.ok) { setError(`サーバーエラー（${res.status}）`); return; }

      const data = JSON.parse(rawText);
      const body = data.body
        ? (typeof data.body === "string" ? JSON.parse(data.body) : data.body)
        : data;

      setPeriodLabel(`分析期間：${body.date_from} 〜 ${body.date_to}`);
      setTopTrends(body.top_trends || []);
      setWorstTrends(body.worst_trends || []);
      setProposals(parseProposals(body.proposals));
      setImages(body.images || []);
      setStatus("✅ 生成完了");

    } catch (e) {
      setError(`エラー：${e.message}`);
    } finally {
      stopLoadingMessages();
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* 戻るボタン */}
      <button style={s.backBtn} onClick={() => onNavigate("top")}>
        ← 戻る
      </button>

      <h1 style={s.h1}>🛒 新商品提案システム</h1>
      <p style={s.subtitle}>期間を選択して、売れ行きデータから新商品を提案します</p>

      {/* 日付選択 */}
      <div style={s.datePicker}>
        <label style={s.label}>📅 開始日</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={s.dateInput} />
        <span>〜</span>
        <label style={s.label}>終了日</label>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={s.dateInput} />
      </div>

      <button
        style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
        onClick={getProposal}
        disabled={loading}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#e88a00"; }}
        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#ff9900"; }}
      >
        {loading ? "生成中..." : "この期間で提案を生成する"}
      </button>

      {status && <p style={s.status}>{status}</p>}
      {periodLabel && <p style={s.periodLabel}>{periodLabel}</p>}

      {/* ローディング */}
      {loading && (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <p>{loadingMsg}</p>
        </div>
      )}

      {/* エラー */}
      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {/* トレンド */}
      {topTrends.length > 0 && (
        <div style={s.trendsGrid}>
          <div style={{ ...s.trendBox, borderTop: "3px solid #ff9900" }}>
            <h2 style={{ ...s.trendTitle, color: "#e07b00" }}>📈 人気トピック TOP10</h2>
            {topTrends.map((r, i) => (
              <div key={i} style={s.trendItem}>
                <span>{i + 1}. {r.genre} × {r.keyword_1} × {r.keyword_2}</span>
                <span style={{ ...s.trendScore, color: "#27ae60" }}>
                  +{parseFloat(r.popularity_score).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ ...s.trendBox, borderTop: "3px solid #e74c3c" }}>
            <h2 style={{ ...s.trendTitle, color: "#c0392b" }}>📉 売れ残りトピック TOP10</h2>
            {worstTrends.map((r, i) => (
              <div key={i} style={s.trendItem}>
                <span>{i + 1}. {r.genre} × {r.keyword_1} × {r.keyword_2}</span>
                <span style={{ ...s.trendScore, color: "#e74c3c" }}>
                  {parseFloat(r.popularity_score).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提案カード */}
      {proposals.length > 0 && (
        <div style={s.proposalsWrap}>
          <h2 style={s.proposalsTitle}>💡 新商品提案</h2>
          <div style={s.proposalGrid}>
            {proposals.map((p, i) => (
              <div key={i} style={s.card}>
                {images[i]?.base64
                  ? <img src={`data:image/png;base64,${images[i].base64}`} alt={p.name} style={s.cardImg} />
                  : <div style={s.noImage}>🖼️ 画像なし</div>
                }
                <div style={s.cardBody}>
                  <h3 style={s.cardTitle}>{p.name}</h3>
                  <span style={s.tag}>{p.genre}</span>
                  {p.keyword.split("・").map((k, j) => (
                    <span key={j} style={s.tag}>{k.trim()}</span>
                  ))}
                  <p style={s.cardLabel}>📊 根拠</p>
                  <p style={s.cardText}>{p.basis}</p>
                  <p style={s.cardLabel}>🎯 ターゲット</p>
                  <p style={s.cardText}>{p.target}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:          { fontFamily: "'Helvetica Neue', sans-serif", background: "#f0f2f5", minHeight: "100vh", padding: "32px 16px", position: "relative" },
  backBtn:       { position: "fixed", top: "20px", left: "20px", padding: "10px 20px", fontSize: "15px", background: "#fff", border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", zIndex: 100 },
  h1:            { textAlign: "center", fontSize: "24px", marginBottom: "8px", color: "#232f3e" },
  subtitle:      { textAlign: "center", color: "#666", marginBottom: "24px" },
  datePicker:    { display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" },
  label:         { fontSize: "14px", color: "#333" },
  dateInput:     { padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" },
  btn:           { display: "block", margin: "0 auto 32px", padding: "14px 40px", fontSize: "18px", background: "#ff9900", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" },
  btnDisabled:   { background: "#ccc", cursor: "not-allowed" },
  status:        { textAlign: "center", color: "#666", marginBottom: "12px", fontSize: "15px" },
  periodLabel:   { textAlign: "center", fontSize: "13px", color: "#888", marginBottom: "20px" },
  loadingWrap:   { textAlign: "center", padding: "40px" },
  spinner:       { display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #ff9900", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "16px" },
  errorBox:      { maxWidth: "600px", margin: "0 auto", padding: "20px", background: "#ffeaea", borderRadius: "8px", color: "#c0392b", textAlign: "center" },
  trendsGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "1000px", margin: "0 auto 40px" },
  trendBox:      { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  trendTitle:    { fontSize: "16px", marginBottom: "16px", paddingBottom: "8px", borderBottom: "2px solid #eee" },
  trendItem:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: "13px" },
  trendScore:    { fontWeight: "bold", fontSize: "14px", minWidth: "60px", textAlign: "right" },
  proposalsWrap: { maxWidth: "1000px", margin: "0 auto" },
  proposalsTitle:{ fontSize: "20px", marginBottom: "20px", color: "#232f3e", textAlign: "center" },
  proposalGrid:  { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
  card:          { background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  cardImg:       { width: "100%", height: "200px", objectFit: "cover" },
  noImage:       { width: "100%", height: "200px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px" },
  cardBody:      { padding: "16px" },
  cardTitle:     { fontSize: "16px", marginBottom: "10px", color: "#232f3e" },
  tag:           { display: "inline-block", background: "#fff3e0", color: "#e07b00", borderRadius: "4px", padding: "2px 8px", fontSize: "12px", margin: "2px 2px 8px 0" },
  cardLabel:     { fontSize: "11px", color: "#999", marginTop: "8px" },
  cardText:      { fontSize: "13px", color: "#555", lineHeight: "1.6", marginTop: "4px" },
};
