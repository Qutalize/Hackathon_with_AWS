import { useState, useRef, useEffect } from "react";

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
    padding: "40px",
    width: "100%",
    maxWidth: "600px",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: "8px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center",
    marginBottom: "24px",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "2px solid #e5e7eb",
    marginBottom: "24px",
  },
  tab: (active) => ({
    flex: 1,
    padding: "10px",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    background: "none",
    color: active ? "#6366f1" : "#6b7280",
    borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
    marginBottom: "-2px",
    transition: "color 0.2s",
  }),
  dropZone: {
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    padding: "24px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
    backgroundColor: "#fafafa",
    marginBottom: "20px",
  },
  dropZoneHover: {
    borderColor: "#6366f1",
    backgroundColor: "#eef2ff",
  },
  dropZoneText: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "8px",
  },
  dropZoneIcon: {
    fontSize: "36px",
    marginBottom: "8px",
  },
  fileInput: {
    display: "none",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  previewCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f9fafb",
  },
  previewImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    display: "block",
  },
  previewInfo: {
    padding: "8px",
    fontSize: "12px",
    color: "#374151",
    backgroundColor: "#fff",
  },
  fileName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontWeight: "600",
    marginBottom: "4px",
  },
  clearBtn: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "rgba(0,0,0,0.6)",
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
  },
  uploadButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginBottom: "16px",
  },
  progressContainer: {
    marginTop: "6px",
  },
  progressBar: {
    height: "4px",
    backgroundColor: "#e5e7eb",
    borderRadius: "9999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: "9999px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "10px",
    color: "#6b7280",
    marginTop: "4px",
    textAlign: "right",
  },
  statusBox: (type) => ({
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "16px",
    backgroundColor: type === "success" ? "#f0fdf4" : type === "error" ? "#fef2f2" : "#eff6ff",
    color: type === "success" ? "#166534" : type === "error" ? "#991b1b" : "#1e40af",
    border: `1px solid ${type === "success" ? "#bbf7d0" : type === "error" ? "#fecaca" : "#bfdbfe"}`,
  }),
  cameraContainer: {
    marginBottom: "20px",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#000",
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
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  stopButton: {
    padding: "12px 16px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  startCameraButton: {
    width: "100%",
    padding: "32px 20px",
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#fafafa",
    cursor: "pointer",
    marginBottom: "20px",
    fontSize: "15px",
  },
  fileCount: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: "12px",
    textAlign: "right",
  },
  stockContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
  },
  stockLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  stockInput: {
    width: "100px",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    textAlign: "right",
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
  },
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

export default function StaffPage({ onNavigate }) {
  const [tab, setTab] = useState("file");
  const [filesState, setFilesState] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [globalStatus, setGlobalStatus] = useState(null);
  const [btnHover2, setBtnHover2] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(0);

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
        uploadedUrl: null
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
        body: JSON.stringify({ images: base64Images, stock: stockQuantity, ssid }),
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
          if (!presignRes.ok || presignData.error) throw new Error(presignData.error || `S3 API Error ${presignRes.status}`);
          const s3Res = await fetch(presignData.presignedUrl, { method: "PUT", body: fileObj.file });
          if (!s3Res.ok) throw new Error(`S3 Put Error ${s3Res.status}`);
          updateFileState(fileObj.id, { uploadedUrl: presignData.url });
        } catch (err) {
          console.error(`S3 upload failed for ${fileObj.file.name}`, err);
        }
      }));
    })();
    try {
      const [analysisResult] = await Promise.all([bedrockPromise, s3Promise]);
      filesToProcess.forEach(f => updateFileState(f.id, { status: { type: "success", message: "分析＆保存 完了!" }, progress: 100, analysis_result: analysisResult }));
      setGlobalStatus({ type: "success", message: "すべての処理が完了しました！" });
    } catch (err) {
      filesToProcess.forEach(f => updateFileState(f.id, { status: { type: "error", message: `分析失敗: ${err.message}` }, progress: 0 }));
      setGlobalStatus({ type: "error", message: "分析処理でエラーが発生しました。" });
    }
    setUploading(false);
    setStockQuantity(0);
  };

  const isBtnDisabled = filesState.filter(f => !f.uploadedUrl && !f.analysis_result).length === 0 || uploading;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => onNavigate("top")}>← トップに戻る</button>
        <h1 style={styles.title}>Image Uploader</h1>
        <p style={styles.subtitle}>Upload up to 3 images directly to AWS S3</p>

        <div style={styles.tabContainer}>
          <button style={styles.tab(tab === "file")} onClick={() => handleTabChange("file")}>ファイル選択</button>
          <button style={styles.tab(tab === "camera")} onClick={() => handleTabChange("camera")}>カメラで撮影</button>
        </div>

        {globalStatus && <div style={styles.statusBox(globalStatus.type)}>{globalStatus.message}</div>}

        <div style={styles.fileCount}>選択 : {filesState.length} / 3 枚</div>

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
              <div style={{ fontSize: "15px", color: "#374151" }}>Drag & drop images here</div>
              <div style={styles.dropZoneText}>残り {3 - filesState.length} 枚追加可能</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={styles.fileInput} onChange={handleInputChange} />
          </>
        )}

        {tab === "camera" && filesState.length < 3 && (
          <>
            {!cameraActive ? (
              <button style={styles.startCameraButton} onClick={startCamera}>📷 カメラ起動</button>
            ) : (
              <>
                <div style={styles.cameraContainer}><video ref={videoRef} style={styles.cameraVideo} autoPlay playsInline muted /></div>
                <div style={styles.cameraControls}>
                  <button style={styles.captureButton} onClick={handleCapture}>撮影 (残り{3 - filesState.length}枚)</button>
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
                <img src={item.previewUrl} alt="Preview" style={styles.previewImage} />
                <div style={styles.previewInfo}>
                  <div style={styles.fileName}>{item.file.name}</div>
                  <div style={{ color: "#6b7280" }}>{formatFileSize(item.file.size)}</div>
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

        {(() => {
          const uniqueResults = [...new Set(filesState.map(f => f.analysis_result).filter(Boolean))];
          if (uniqueResults.length === 0) return null;
          return (
            <div style={{ marginBottom: "20px", padding: "20px", borderRadius: "8px", border: "2px solid #10b981", backgroundColor: "#f0fdf4" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#065f46", marginBottom: "12px" }}>✓ 抽出された商品情報（必要に応じて修正可能）</div>
              {uniqueResults.map((res, idx) => (
                <textarea
                  key={idx}
                  value={res}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setFilesState(prev => prev.map(f => f.analysis_result === res ? { ...f, analysis_result: newVal } : f));
                  }}
                  style={{ width: "100%", fontSize: "14px", padding: "12px", borderRadius: "6px", border: "1px solid #34d399", backgroundColor: "#ffffff", color: "#064e3b", resize: "vertical", minHeight: "150px", boxSizing: "border-box", marginBottom: idx < uniqueResults.length - 1 ? "12px" : "0", lineHeight: "1.5" }}
                />
              ))}
            </div>
          );
        })()}

        {filesState.filter(f => !f.uploadedUrl && !f.analysis_result).length > 0 && (
          <div style={styles.stockContainer}>
            <label style={styles.stockLabel} htmlFor="stockInput">在庫数を入力（一括）</label>
            <input
              id="stockInput"
              type="number"
              min="0"
              style={styles.stockInput}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={uploading}
              placeholder="0"
            />
          </div>
        )}

        <button
          style={{ ...styles.uploadButton, backgroundColor: isBtnDisabled ? "#a5b4fc" : "#10b981", marginBottom: "8px", ...(btnHover2 && !isBtnDisabled ? { backgroundColor: "#059669" } : {}) }}
          onClick={handleProcessAll}
          disabled={isBtnDisabled}
          onMouseEnter={() => setBtnHover2(true)}
          onMouseLeave={() => setBtnHover2(false)}
        >
          {uploading ? "分析中..." : `画像保存 ＆ AI分析を実行 (残り${filesState.filter(f => !f.analysis_result).length}件)`}
        </button>
      </div>
    </div>
  );
}
