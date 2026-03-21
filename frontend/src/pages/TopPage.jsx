import { useEffect, useRef } from "react";

const InventoryIllustration = () => (
  <svg width="80" height="72" viewBox="0 0 80 72" style={{ display: "block" }}>
    <rect x="8" y="44" width="64" height="8" rx="3" fill="#fca5a5"/>
    <rect x="8" y="30" width="64" height="8" rx="3" fill="#fca5a5"/>
    <rect x="8" y="16" width="64" height="8" rx="3" fill="#fca5a5"/>
    <rect x="5" y="14" width="4" height="48" rx="2" fill="#f87171"/>
    <rect x="71" y="14" width="4" height="48" rx="2" fill="#f87171"/>
    <rect x="14" y="34" width="10" height="8" rx="2" fill="#ef4444"/>
    <rect x="28" y="34" width="10" height="8" rx="2" fill="#ef4444"/>
    <rect x="42" y="34" width="10" height="8" rx="2" fill="#ef4444"/>
    <rect x="56" y="34" width="10" height="8" rx="2" fill="#ef4444"/>
    <rect x="14" y="20" width="8"  height="8" rx="2" fill="#ef4444"/>
    <rect x="26" y="20" width="14" height="8" rx="2" fill="#ef4444"/>
    <rect x="44" y="20" width="8"  height="8" rx="2" fill="#ef4444"/>
    <rect x="14" y="48" width="52" height="12" rx="3" fill="#fca5a5"/>
    <rect x="20" y="50" width="8"  height="8" rx="2" fill="#ef4444"/>
    <rect x="32" y="50" width="12" height="8" rx="2" fill="#ef4444"/>
    <rect x="48" y="50" width="8"  height="8" rx="2" fill="#ef4444"/>
    <circle cx="65" cy="22" r="8" fill="#ef4444"/>
    <text x="65" y="26" textAnchor="middle" fontSize="9" fontWeight="800" fill="white">!</text>
  </svg>
);

const StaffIllustration = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" style={{ display: "block" }}>
    <circle cx="36" cy="20" r="11" fill="#93c5fd"/>
    <circle cx="36" cy="20" r="8"  fill="#3b82f6"/>
    <circle cx="36" cy="18" r="4"  fill="#bfdbfe"/>
    <rect x="16" y="33" width="40" height="24" rx="6" fill="#3b82f6"/>
    <rect x="20" y="33" width="32" height="10" rx="3" fill="#60a5fa"/>
    <rect x="22" y="46" width="8"  height="8" rx="2" fill="#bfdbfe"/>
    <rect x="32" y="46" width="8"  height="8" rx="2" fill="#bfdbfe"/>
    <rect x="42" y="46" width="8"  height="8" rx="2" fill="#bfdbfe"/>
    <rect x="31" y="35" width="10" height="6" rx="2" fill="#1d4ed8"/>
    <text x="36" y="40" textAnchor="middle" fontSize="5" fontWeight="800" fill="white">STAFF</text>
    <path d="M24 57 Q36 63 48 57" stroke="#93c5fd" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

const CustomerIllustration = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" style={{ display: "block" }}>
    <path d="M18 20 L22 20 L28 46 L52 46 L56 28 L24 28" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="26" y="30" width="8"  height="12" rx="2" fill="#10b981"/>
    <rect x="37" y="30" width="8"  height="12" rx="2" fill="#10b981"/>
    <rect x="26" y="30" width="8"  height="5"  rx="1" fill="#6ee7b7"/>
    <rect x="37" y="30" width="8"  height="5"  rx="1" fill="#6ee7b7"/>
    <circle cx="30" cy="50" r="4" fill="#10b981"/>
    <circle cx="48" cy="50" r="4" fill="#10b981"/>
    <circle cx="30" cy="50" r="2" fill="#d1fae5"/>
    <circle cx="48" cy="50" r="2" fill="#d1fae5"/>
    <circle cx="58" cy="22" r="8" fill="#10b981"/>
    <text x="58" y="26" textAnchor="middle" fontSize="9" fontWeight="800" fill="white">¥</text>
  </svg>
);

const ProductIllustration = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" style={{ display: "block" }}>
    <path d="M36 12 C26 12 20 19 20 27 C20 33 23 37 28 40 L28 50 L44 50 L44 40 C49 37 52 33 52 27 C52 19 46 12 36 12Z" fill="#fbbf24"/>
    <path d="M36 14 C27 14 22 20 22 27 C22 32 25 36 29 39 L29 48 L43 48 L43 39 C47 36 50 32 50 27 C50 20 45 14 36 14Z" fill="#fcd34d"/>
    <rect x="28" y="50" width="16" height="4" rx="2" fill="#f59e0b"/>
    <rect x="29" y="54" width="14" height="4" rx="2" fill="#f59e0b"/>
    <rect x="30" y="58" width="12" height="4" rx="2" fill="#f59e0b"/>
    <circle cx="36" cy="27" r="6" fill="#f59e0b"/>
    <circle cx="36" cy="27" r="3" fill="#fffbeb"/>
    <path d="M36 18 L36 22 M36 32 L36 36 M27 27 L31 27 M41 27 L45 27" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 21 L32 23 M40 31 L42 33 M30 33 L32 31 M40 23 L42 21" stroke="#fcd34d" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const CARDS = [
  {
    label: "仕入れ担当者",
    sub: "Inventory",
    color: "#ef4444",
    bg: "linear-gradient(135deg,#fee2e2 0%,#fecaca 100%)",
    arrowBg: "#fee2e2",
    Illustration: InventoryIllustration,
    action: () => window.location.href = "https://prod.dlv6xelof2itp.amplifyapp.com/subscribe.html",
  },
  {
    label: "店員",
    sub: "Staff",
    color: "#3b82f6",
    bg: "linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)",
    arrowBg: "#dbeafe",
    Illustration: StaffIllustration,
    action: (nav) => nav("staff"),
  },
  {
    label: "顧客",
    sub: "Customer",
    color: "#10b981",
    bg: "linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)",
    arrowBg: "#d1fae5",
    Illustration: CustomerIllustration,
    action: (nav) => nav("customer"),
  },
  {
    label: "商品開発者",
    sub: "Product Dev",
    color: "#f59e0b",
    bg: "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
    arrowBg: "#fef3c7",
    Illustration: ProductIllustration,
    action: (nav) => nav("product"),
  },
];

export default function TopPage({ onNavigate }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = `opacity 0.55s ease ${i * 0.07}s, transform 0.55s ease ${i * 0.07}s`;
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 40);
    });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; }

        .tp-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #f0f4ff 0%, #fef9f0 50%, #f0fff8 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 16px 40px;
          font-family: 'Nunito', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .tp-root::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(147,197,253,0.25) 0%, transparent 70%);
          top: -150px; left: -100px;
          pointer-events: none;
        }

        .tp-root::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(167,243,208,0.25) 0%, transparent 70%);
          bottom: -100px; right: -80px;
          pointer-events: none;
        }

        .tp-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.8);
          border: 1.5px solid rgba(255,255,255,0.95);
          border-radius: 100px;
          padding: 8px 18px;
          margin-bottom: 18px;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .tp-badge-text {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #64748b;
        }

        .tp-title {
          font-size: clamp(24px, 6vw, 42px);
          font-weight: 900;
          color: #1e293b;
          text-align: center;
          line-height: 1.1;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .tp-sub {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 28px;
        }

        .tp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
          max-width: 400px;
        }

        @media (max-width: 360px) {
          .tp-grid { grid-template-columns: 1fr; max-width: 280px; }
        }

        .tp-card {
          border-radius: 20px;
          background: #fff;
          border: 1.5px solid rgba(0,0,0,0.05);
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.22s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .tp-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 16px 36px rgba(0,0,0,0.12);
        }

        .tp-card:active { transform: scale(0.96); }

        .card-img {
          width: 100%;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-body {
          padding: 12px 14px 14px;
        }

        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .card-label {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
        }

        .card-arrow {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .card-sub {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.04em;
        }

        .tp-footer {
          margin-top: 28px;
          font-size: 10px;
          color: #cbd5e1;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}</style>

      <div className="tp-root">
        <div className="tp-badge" ref={el => refs.current[0] = el}>
          <span style={{ fontSize: "16px" }}>🏪</span>
          <span className="tp-badge-text">Convenience Store System</span>
        </div>

        <h1 className="tp-title" ref={el => refs.current[1] = el}>
          一石四鳥<br />コンビニ在庫アプリ
        </h1>

        <p className="tp-sub" ref={el => refs.current[2] = el}>
          役割を選択してください
        </p>

        <div className="tp-grid">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="tp-card"
              onClick={() => card.action(onNavigate)}
              ref={el => refs.current[3 + i] = el}
            >
              <div className="card-img" style={{ background: card.bg }}>
                <card.Illustration />
              </div>
              <div className="card-body">
                <div className="card-top-row">
                  <span className="card-label">{card.label}</span>
                  <span className="card-arrow" style={{ background: card.arrowBg, color: card.color }}>→</span>
                </div>
                <span className="card-sub">{card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="tp-footer" ref={el => refs.current[7] = el}>
          © 2026 Qutalize · Hackathon with AWS
        </p>
      </div>
    </>
  );
}
