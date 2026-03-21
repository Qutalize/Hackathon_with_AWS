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
      name:    (block.match(/商品名：(.+)/)     || [])[1] || "",
      genre:   (block.match(/ジャンル：(.+)/)   || [])[1] || "",
      keyword: (block.match(/キーワード：(.+)/) || [])[1] || "",
      basis:   (block.match(/根拠：(.+)/)       || [])[1] || "",
      target:  (block.match(/ターゲット：(.+)/) || [])[1] || "",
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; }

        .pd-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #f0f4ff 0%, #fef9f0 50%, #f0fff8 100%);
          font-family: 'Nunito', sans-serif;
          padding: 80px 16px 60px;
          position: relative;
          overflow-x: hidden;
        }

        .pd-root::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%);
          top: -100px; right: -100px;
          pointer-events: none;
        }

        .pd-back {
          position: fixed;
          top: 16px; left: 16px;
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.85);
          border: 1.5px solid rgba(0,0,0,0.07);
          border-radius: 100px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          cursor: pointer;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          z-index: 100;
          transition: transform 0.15s, box-shadow 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .pd-back:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .pd-back:active { transform: scale(0.96); }

        .pd-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .pd-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.8);
          border: 1.5px solid rgba(255,255,255,0.95);
          border-radius: 100px;
          padding: 6px 16px;
          margin-bottom: 14px;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
        }

        .pd-title {
          font-size: clamp(22px, 5vw, 36px);
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .pd-sub {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 600;
        }

        /* Date picker card */
        .pd-picker-card {
          background: #fff;
          border-radius: 20px;
          border: 1.5px solid rgba(0,0,0,0.05);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          padding: 20px 20px;
          max-width: 560px;
          margin: 0 auto 20px;
        }

        .pd-picker-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .pd-picker-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .pd-date-input {
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.15s;
        }
        .pd-date-input:focus { border-color: #f59e0b; }

        .pd-sep {
          font-size: 16px;
          font-weight: 800;
          color: #cbd5e1;
        }

        /* Generate button */
        .pd-gen-btn {
          display: block;
          margin: 0 auto 24px;
          padding: 14px 36px;
          font-size: 16px;
          font-weight: 800;
          font-family: 'Nunito', sans-serif;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          color: #fff;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(245,158,11,0.35);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .pd-gen-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(245,158,11,0.4);
        }
        .pd-gen-btn:active:not(:disabled) { transform: scale(0.97); }
        .pd-gen-btn:disabled {
          background: linear-gradient(135deg, #d1d5db 0%, #e5e7eb 100%);
          box-shadow: none;
          cursor: not-allowed;
        }

        .pd-status {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
        }

        .pd-period {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 20px;
          letter-spacing: 0.02em;
        }

        /* Loading */
        .pd-loading {
          text-align: center;
          padding: 40px 20px;
        }

        .pd-spinner {
          width: 44px; height: 44px;
          border: 4px solid #fde68a;
          border-top: 4px solid #f59e0b;
          border-radius: 50%;
          animation: pd-spin 0.9s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes pd-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pd-loading-msg {
          font-size: 15px;
          font-weight: 700;
          color: #64748b;
        }

        /* Error */
        .pd-error {
          max-width: 560px;
          margin: 0 auto 24px;
          padding: 16px 20px;
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          border-radius: 16px;
          color: #dc2626;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }

        /* Trends */
        .pd-trends {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 900px;
          margin: 0 auto 36px;
        }

        @media (max-width: 580px) {
          .pd-trends { grid-template-columns: 1fr; }
        }

        .pd-trend-card {
          background: #fff;
          border-radius: 20px;
          border: 1.5px solid rgba(0,0,0,0.05);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          padding: 20px;
          overflow: hidden;
        }

        .pd-trend-title {
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f1f5f9;
          letter-spacing: -0.01em;
        }

        .pd-trend-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 0;
          border-bottom: 1px solid #f8fafc;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          gap: 8px;
        }
        .pd-trend-item:last-child { border-bottom: none; }

        .pd-trend-item-name { flex: 1; min-width: 0; }

        .pd-trend-score {
          font-weight: 900;
          font-size: 13px;
          flex-shrink: 0;
          padding: 2px 10px;
          border-radius: 100px;
          font-family: 'Nunito', monospace;
        }

        /* Proposals */
        .pd-proposals {
          max-width: 900px;
          margin: 0 auto;
        }

        .pd-proposals-title {
          font-size: clamp(18px, 4vw, 24px);
          font-weight: 900;
          color: #1e293b;
          text-align: center;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .pd-proposal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 700px) {
          .pd-proposal-grid { grid-template-columns: 1fr; }
        }

        @media (min-width: 701px) and (max-width: 900px) {
          .pd-proposal-grid { grid-template-columns: 1fr 1fr; }
        }

        .pd-prop-card {
          background: #fff;
          border-radius: 20px;
          border: 1.5px solid rgba(0,0,0,0.05);
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .pd-prop-img {
          width: 100%;
          height: 180px;
          object-fit: cover;
        }

        .pd-prop-no-img {
          width: 100%;
          height: 180px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .pd-prop-body {
          padding: 16px;
        }

        .pd-prop-title {
          font-size: 15px;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .pd-tag {
          display: inline-block;
          background: #fef3c7;
          color: #d97706;
          border-radius: 100px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 800;
          margin: 2px 2px 8px 0;
        }

        .pd-prop-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-top: 10px;
          margin-bottom: 4px;
        }

        .pd-prop-text {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          line-height: 1.65;
        }
      `}</style>

      <div className="pd-root">

        {/* 戻るボタン */}
        <button className="pd-back" onClick={() => onNavigate("top")}>
          ← 戻る
        </button>

        {/* ヘッダー */}
        <div className="pd-header">
          <div className="pd-badge">💡 Product Development</div>
          <h1 className="pd-title">🛒 新商品提案システム</h1>
          <p className="pd-sub">期間を選択して、売れ行きデータから新商品を提案します</p>
        </div>

        {/* 日付選択カード */}
        <div className="pd-picker-card">
          <p className="pd-picker-label">📅 分析期間を選択</p>
          <div className="pd-picker-row">
            <input
              type="date"
              className="pd-date-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
            <span className="pd-sep">〜</span>
            <input
              type="date"
              className="pd-date-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* 生成ボタン */}
        <button
          className="pd-gen-btn"
          onClick={getProposal}
          disabled={loading}
        >
          {loading ? "生成中..." : "この期間で提案を生成する ✨"}
        </button>

        {status     && <p className="pd-status">{status}</p>}
        {periodLabel && <p className="pd-period">{periodLabel}</p>}

        {/* ローディング */}
        {loading && (
          <div className="pd-loading">
            <div className="pd-spinner" />
            <p className="pd-loading-msg">{loadingMsg}</p>
          </div>
        )}

        {/* エラー */}
        {error && <div className="pd-error">⚠️ {error}</div>}

        {/* トレンド */}
        {topTrends.length > 0 && (
          <div className="pd-trends">
            <div className="pd-trend-card">
              <h2 className="pd-trend-title" style={{ color: "#d97706" }}>📈 人気トピック TOP10</h2>
              {topTrends.map((r, i) => (
                <div key={i} className="pd-trend-item">
                  <span className="pd-trend-item-name">{i + 1}. {r.genre} × {r.keyword_1} × {r.keyword_2}</span>
                  <span className="pd-trend-score" style={{ background: "#d1fae5", color: "#059669" }}>
                    +{parseFloat(r.popularity_score).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pd-trend-card">
              <h2 className="pd-trend-title" style={{ color: "#dc2626" }}>📉 売れ残りトピック TOP10</h2>
              {worstTrends.map((r, i) => (
                <div key={i} className="pd-trend-item">
                  <span className="pd-trend-item-name">{i + 1}. {r.genre} × {r.keyword_1} × {r.keyword_2}</span>
                  <span className="pd-trend-score" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    {parseFloat(r.popularity_score).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提案カード */}
        {proposals.length > 0 && (
          <div className="pd-proposals">
            <h2 className="pd-proposals-title">💡 新商品提案</h2>
            <div className="pd-proposal-grid">
              {proposals.map((p, i) => (
                <div key={i} className="pd-prop-card">
                  {images[i]?.base64
                    ? <img src={`data:image/png;base64,${images[i].base64}`} alt={p.name} className="pd-prop-img" />
                    : <div className="pd-prop-no-img">🧪</div>
                  }
                  <div className="pd-prop-body">
                    <h3 className="pd-prop-title">{p.name}</h3>
                    <span className="pd-tag">{p.genre}</span>
                    {p.keyword.split("・").map((k, j) => (
                      <span key={j} className="pd-tag">{k.trim()}</span>
                    ))}
                    <p className="pd-prop-label">📊 根拠</p>
                    <p className="pd-prop-text">{p.basis}</p>
                    <p className="pd-prop-label">🎯 ターゲット</p>
                    <p className="pd-prop-text">{p.target}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
