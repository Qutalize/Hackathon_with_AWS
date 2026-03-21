import { useState, useRef, useEffect } from "react";

const COLOR = {
  primary: "#6366f1",
  primaryHover: "#4f46e5",
  primaryLight: "#eef2ff",
  success: "#10b981",
  successHover: "#059669",
  successLight: "#f0fdf4",
  error: "#ef4444",
  errorLight: "#fef2f2",
  info: "#3b82f6",
  infoLight: "#eff6ff",
  border: "#e5e7eb",
  muted: "#6b7280",
  text: "#1a1a2e",
  textSub: "#374151",
  bg: "#f8fafc",
  card: "#ffffff",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%)",
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
    boxShadow: "0 8px 40px rgba(99,102,241,0.10), 0 2px 8px rgba(0,0,0,0.06)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "600px",
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
    color: COLOR.primary,
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    padding: "3px 12px",
    borderRadius: "999px",
    marginBottom: "10px",
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
  tabContainer: {
    display: "flex",
    backgroundColor: COLOR.bg,
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "24px",
    gap: "4px",
  },
  tab: (active) => ({
    flex: 1,
    padding: "10px 0",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    borderRadius: "9px",
    background: active ? COLOR.card : "transparent",
    color: active ? COLOR.primary : COLOR.muted,
    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
    transition: "all 0.2s",
  }),
  statusBox: (type) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    marginBottom: "16px",
    backgroundColor:
      type === "success" ? COLOR.successLight
      : type === "error" ? COLOR.errorLight
      : COLOR.infoLight,
    color:
      type === "success" ? "#065f46"
      : type === "error" ? "#991b1b"
      : "#1e40af",
    border: `1px solid ${
      type === "success" ? "#bbf7d0"
      : type === "error" ? "#fecaca"
      : "#bfdbfe"
    }`,
  }),
  fileCount: {
    fontSize: "12px",
    fontWeight: "700",
    color: COLOR.muted,
    marginBottom: "12px",
    textAlign: "right",
    letterSpacing: "0.04em",
  },
  dropZone: {
    border: `2px dashed ${COLOR.border}`,
    borderRadius: "14px",
    padding: "32px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
    backgroundColor: COLOR.bg,
    marginBottom: "20px",
  },
  dropZoneHover: {
    borderColor: COLOR.primary,
    backgroundColor: COLOR.primaryLight,
  },
  dropZoneIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },
  dropZoneText: {
    fontSize: "15px",
    fontWeight: "600",
    color: COLOR.textSub,
    marginBottom: "4px",
  },
  dropZoneSub: {
    fontSize: "12px",
    color: COLOR.muted,
  },
  fileInput: { display: "none" },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  previewCard: {
    border: `1px solid ${COLOR.border}`,
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLOR.bg,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  previewImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    display: "block",
  },
  previewInfo: {
    padding: "8px 10px",
    fontSize: "11px",
    color: COLOR.textSub,
    backgroundColor: COLOR.card,
  },
  fileName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontWeight: "700",
    marginBottom: "2px",
  },
  clearBtn: {
    position: "absolute",
    top: "6px",
    right: "6px",
    background: "rgba(0,0,0,0.55)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    zIndex: 10,
    backdropFilter: "blur(2px)",
  },
  progressContainer: { marginTop: "6px" },
  progressBar: {
    height: "4px",
    backgroundColor: COLOR.border,
    borderRadius: "9999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLOR.primary,
    borderRadius: "9999px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "10px",
    color: COLOR.muted,
    marginTop: "3px",
    textAlign: "right",
  },
  cameraContainer: {
    marginBottom: "16px",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#000",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
  cameraVideo: {
    width: "100%",
    maxHeight: "300px",
    display: "block",
    objectFit: "cover",
  },
  cameraControls: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  captureButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: COLOR.primary,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    transition: "background-color 0.2s",
  },
  stopButton: {
    padding: "12px 16px",
    backgroundColor: COLOR.error,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
  startCameraButton: {
    width: "100%",
    padding: "32px 20px",
    border: `2px dashed ${COLOR.border}`,
    borderRadius: "14px",
    backgroundColor: COLOR.bg,
    cursor: "pointer",
    marginBottom: "20px",
    fontSize: "15px",
    fontWeight: "600",
    color: COLOR.textSub,
    transition: "border-color 0.2s, background-color 0.2s",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLOR.bg,
    border: `1px solid ${COLOR.border}`,
    borderRadius: "12px",
    padding: "14px 18px",
    marginBottom: "12px",
  },
  inputLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: COLOR.textSub,
  },
  inputField: {
    width: "110px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: `1.5px solid ${COLOR.border}`,
    fontSize: "15px",
    textAlign: "right",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: COLOR.card,
    color: COLOR.text,
  },
  resultBox: {
    marginBottom: "20px",
    padding: "20px",
    borderRadius: "14px",
    border: `2px solid #10b981`,
    backgroundColor: COLOR.successLight,
  },
  resultTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#065f46",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  resultTextarea: {
    width: "100%",
    fontSize: "13px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #34d399",
    backgroundColor: COLOR.card,
    color: "#064e3b",
    resize: "vertical",
    minHeight: "150px",
    boxSizing: "border-box",
    lineHeight: "1.6",
    fontFamily: "inherit",
  },
  actionButton: (disabled, color) => ({
    width: "100%",
    padding: "14px",
    backgroundColor: disabled ? "#a5b4fc" : color,
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    letterSpacing: "0.02em",
  }),
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const compressImageBase64 = (file, maxWidth = 1600) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * (ratio < 1 ? ratio : 1);
        if (ratio >= 1) canvas.width = img.width;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const STATUS_ICON = { success: "✅", error: "❌", info: "ℹ️" };

export default function StaffPage({ onNavigate }) {
  const [tab, setTab] = useState("file");
  const [filesState, setFilesState] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [globalStatus, setGlobalStatus] = useState(null);
  const [btnHover, setBtnHover] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [storeId, setStoreId] = useState("");

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleTabChange = (newTab) => {
    stopCamera();
    setTab(newTab);
    setGlobalStatus(null);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    if (filesState.length >= 3) {
      setGlobalStatus({ type: "error", message: "すでに最大3枚選択されています。" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setGlobalStatus(null);
    } catch {
      setGlobalStatus({ type: "error", message: "カメラへのアクセスが拒否されました。" });
    }
  };

  const handleFilesSelect = (newFilesList) => {
    const validFiles = Array.from(newFilesList).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;
    setFilesState(prev => {
      const remainingSlots = 3 - prev.length;
      if (remainingSlots <= 0) {
        setGlobalStatus({ type: "error", message: "最大3枚までです。" });
        return prev;
      }
      const filesToAdd = validFiles.slice(0, remainingSlots);
      if (validFiles.length > remainingSlots) {
        setGlobalStatus({ type: "info", message: "最大3枚までです。残りは無視されました。" });
      } else {
        setGlobalStatus(null);
      }
      const newItems = filesToAdd.map(f => ({
        id: Math.random().toString(36).substring(7),
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: null,
        progress: 0,
        uploadedUrl: null,
      }));
      return [...prev, ...newItems];
    });
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
      handleFilesSelect([file]);
      if (filesState.length + 1 >= 3) { stopCamera(); setTab("file"); }
    }, "image/jpeg");
  };

  const handleInputChange = (e) => { handleFilesSelect(e.target.files); e.target.value = ""; };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (filesState.length < 3) handleFilesSelect(e.dataTransfer.files); };
  const handleRemoveFile = (id) => {
    setFilesState(prev => prev.filter(item => { if (item.id === id) { URL.revokeObjectURL(item.previewUrl); return false; } return true; }));
    setGlobalStatus(null);
  };
  const updateFileState = (id, updates) => {
    setFilesState(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleProcessAll = async () => {
    const filesToProcess = filesState.filter(f => !f.analysis_result);
    if (filesToProcess.length === 0) return;
    if (!storeId.trim()) { setGlobalStatus({ type: "error", message: "店舗IDを入力してください。" }); return; }
    if (!stockQuantity || Number(stockQuantity) < 1) { setGlobalStatus({ type: "error", message: "在庫数は1以上を入力してください。" }); return; }
    const bedrockApiUrl = import.meta.env.VITE_BEDROCK_API_URL;
    if (!bedrockApiUrl) { setGlobalStatus({ type: "error", message: ".env に VITE_BEDROCK_API_URL を設定してください。" }); return; }
    setUploading(true);
    setGlobalStatus({ type: "info", message: "AI分析とS3保存を並行して実行中..." });
    filesToProcess.forEach(f => updateFileState(f.id, { status: { type: "info", message: "処理を開始しました..." }, progress: 10 }));
    const ssid = Date.now();
    const bedrockPromise = (async () => {
      const base64Images = await Promise.all(filesToProcess.map(async (fileObj) => compressImageBase64(fileObj.file)));
      filesToProcess.forEach(f => updateFileState(f.id, { status: { type: "info", message: "Bedrockで分析中..." }, progress: 80 }));
      const res = await fetch(bedrockApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: base64Images, stock: stockQuantity, store_id: `store_${storeId}`, ssid }),
      });
      let data = await res.json();
      if (typeof data.body === "string") data = JSON.parse(data.body);
      if (!res.ok || data.error) throw new Error(data.error || `Bedrock Error ${res.status}`);
      return data.analysis_result;
    })();
    const s3Promise = (async () => {
      const s3ApiUrl = import.meta.env.VITE_API_URL;
      if (!s3ApiUrl) return null;
      await Promise.all(filesToProcess.map(async (fileObj, index) => {
        try {
          const ext = fileObj.file.name.split('.').pop() || "jpg";
          const newFileName = `${ssid}_${index + 1}.${ext}`;
          const presignRes = await fetch(s3ApiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: newFileName, fileType: fileObj.file.type }) });
          let presignData = await presignRes.json();
          if (typeof presignData.body === "string") presignData = JSON.parse(presignData.body);
          if (!presignRes.ok || presignData.error) throw new Error(presignData.error || `S3 API エラー ${presignRes.status}`);
          const s3Res = await fetch(presignData.presignedUrl, { method: "PUT", body: fileObj.file });
          if (!s3Res.ok) throw new Error(`S3 アップロードエラー ${s3Res.status}`);
          updateFileState(fileObj.id, { uploadedUrl: presignData.url });
        } catch (err) {
          console.error(`S3アップロード失敗: ${fileObj.file.name}`, err);
        }
      }));
    })();
    try {
      const [analysisResult] = await Promise.all([bedrockPromise, s3Promise]);
      filesToProcess.forEach(f => updateFileState(f.id, { status: { type: "success", message: "分析・保存 完了！" }, progress: 100, analysis_result: analysisResult }));
      setGlobalStatus({ type: "success", message: "すべての処理が完了しました！" });
    } catch (err) {
      filesToProcess.forEach(f => updateFileState(f.id, { status: { type: "error", message: `分析失敗: ${err.message}` }, progress: 0 }));
      setGlobalStatus({ type: "error", message: "分析処理でエラーが発生しました。" });
    }
    setUploading(false);
    setStockQuantity(0);
    setStoreId("");
  };

  const isBtnDisabled = filesState.filter(f => !f.uploadedUrl && !f.analysis_result).length === 0 || uploading;
  const uniqueResults = [...new Set(filesState.map(f => f.analysis_result).filter(Boolean))];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => onNavigate("top")}>
          ← トップに戻る
        </button>

        <div style={styles.header}>
          <div style={styles.badge}>店員専用</div>
          <h1 style={styles.title}>商品登録</h1>
          <p style={styles.subtitle}>画像をアップロードしてAIで商品情報を自動抽出します（最大3枚）</p>
        </div>

        <div style={styles.tabContainer}>
          <button style={styles.tab(tab === "file")} onClick={() => handleTabChange("file")}>
            🗂 ファイルから選択
          </button>
          <button style={styles.tab(tab === "camera")} onClick={() => handleTabChange("camera")}>
            📷 カメラで撮影
          </button>
        </div>

        {globalStatus && (
          <div style={styles.statusBox(globalStatus.type)}>
            <span>{STATUS_ICON[globalStatus.type]}</span>
            <span>{globalStatus.message}</span>
          </div>
        )}

        <div style={styles.fileCount}>選択中：{filesState.length} / 3 枚</div>

        {tab === "file" && filesState.length < 3 && (
          <>
            <div
              style={{ ...styles.dropZone, ...(isDragging ? styles.dropZoneHover : {}) }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
            >
              <div style={styles.dropZoneIcon}>{isDragging ? "📂" : "🖼️"}</div>
              <div style={styles.dropZoneText}>ここに画像をドラッグ＆ドロップ</div>
              <div style={styles.dropZoneSub}>またはクリックしてファイルを選択・残り {3 - filesState.length} 枚追加可能</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={styles.fileInput} onChange={handleInputChange} />
          </>
        )}

        {tab === "camera" && filesState.length < 3 && (
          <>
            {!cameraActive ? (
              <button style={styles.startCameraButton} onClick={startCamera}>
                📷 カメラを起動する
              </button>
            ) : (
              <>
                <div style={styles.cameraContainer}>
                  <video ref={videoRef} style={styles.cameraVideo} autoPlay playsInline muted />
                </div>
                <div style={styles.cameraControls}>
                  <button style={styles.captureButton} onClick={handleCapture}>
                    撮影する（残り {3 - filesState.length} 枚）
                  </button>
                  <button style={styles.stopButton} onClick={stopCamera}>停止</button>
                </div>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}

        {filesState.length > 0 && (
          <div style={styles.previewGrid}>
            {filesState.map((item) => (
              <div key={item.id} style={styles.previewCard}>
                {!uploading && !item.uploadedUrl && !item.analysis_result && (
                  <button style={styles.clearBtn} onClick={() => handleRemoveFile(item.id)}>&times;</button>
                )}
                <img src={item.previewUrl} alt="プレビュー" style={styles.previewImage} />
                <div style={styles.previewInfo}>
                  <div style={styles.fileName}>{item.file.name}</div>
                  <div style={{ color: COLOR.muted }}>{formatFileSize(item.file.size)}</div>
                  {(uploading || item.progress > 0) && !item.analysis_result && (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${item.progress}%` }} />
                      </div>
                      {item.status && <div style={styles.progressText}>{item.status.message}</div>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {uniqueResults.length > 0 && (
          <div style={styles.resultBox}>
            <div style={styles.resultTitle}>
              <span>✅</span>
              <span>抽出された商品情報（必要に応じて修正できます）</span>
            </div>
            {uniqueResults.map((res, idx) => (
              <textarea
                key={idx}
                value={res}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setFilesState(prev => prev.map(f => f.analysis_result === res ? { ...f, analysis_result: newVal } : f));
                }}
                style={{
                  ...styles.resultTextarea,
                  marginBottom: idx < uniqueResults.length - 1 ? "12px" : "0",
                }}
              />
            ))}
          </div>
        )}

        {filesState.filter(f => !f.uploadedUrl && !f.analysis_result).length > 0 && (
          <>
            <div style={styles.inputRow}>
              <label style={styles.inputLabel} htmlFor="storeIdInput">店舗ID</label>
              <input
                id="storeIdInput"
                type="text"
                style={styles.inputField}
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                disabled={uploading}
                placeholder="0001"
              />
            </div>
            <div style={styles.inputRow}>
              <label style={styles.inputLabel} htmlFor="stockInput">在庫数（一括入力）</label>
              <input
                id="stockInput"
                type="number"
                min="1"
                style={styles.inputField}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={uploading}
                placeholder="0"
              />
            </div>
          </>
        )}

        <button
          style={{
            ...styles.actionButton(isBtnDisabled, uploading ? COLOR.primary : COLOR.success),
            ...(btnHover && !isBtnDisabled ? { backgroundColor: COLOR.successHover } : {}),
          }}
          onClick={handleProcessAll}
          disabled={isBtnDisabled}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
        >
          {uploading
            ? "🔄 分析中..."
            : `🚀 画像保存 ＆ AI分析を実行（${filesState.filter(f => !f.analysis_result).length}件）`}
        </button>
      </div>
    </div>
  );
}
