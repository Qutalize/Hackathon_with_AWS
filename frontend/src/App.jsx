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
    maxWidth: "520px",
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
    padding: "32px 20px",
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
  browseLink: {
    color: "#6366f1",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "underline",
  },
  previewContainer: {
    marginBottom: "20px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  previewImage: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "contain",
    display: "block",
    backgroundColor: "#f9fafb",
  },
  previewInfo: {
    padding: "10px 14px",
    backgroundColor: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
    fontSize: "13px",
    color: "#6b7280",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    padding: "0",
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
  uploadButtonDisabled: {
    backgroundColor: "#a5b4fc",
    cursor: "not-allowed",
  },
  uploadButtonHover: {
    backgroundColor: "#4f46e5",
  },
  progressContainer: {
    marginBottom: "16px",
  },
  progressBar: {
    height: "6px",
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
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "6px",
    textAlign: "center",
  },
  statusBox: (type) => ({
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "16px",
    backgroundColor:
      type === "success" ? "#f0fdf4" : type === "error" ? "#fef2f2" : "#eff6ff",
    color:
      type === "success" ? "#166534" : type === "error" ? "#991b1b" : "#1e40af",
    border: `1px solid ${
      type === "success" ? "#bbf7d0" : type === "error" ? "#fecaca" : "#bfdbfe"
    }`,
  }),
  resultBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "16px",
  },
  resultLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#166534",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  resultUrlContainer: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  resultUrl: {
    fontSize: "13px",
    color: "#374151",
    wordBreak: "break-all",
    flex: 1,
    backgroundColor: "#ffffff",
    border: "1px solid #d1fae5",
    borderRadius: "4px",
    padding: "6px 10px",
  },
  copyBtn: {
    padding: "6px 12px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  resultImageContainer: {
    marginTop: "12px",
    borderRadius: "6px",
    overflow: "hidden",
    border: "1px solid #d1fae5",
  },
  resultImage: {
    width: "100%",
    maxHeight: "200px",
    objectFit: "contain",
    display: "block",
    backgroundColor: "#f9fafb",
  },
  cameraContainer: {
    marginBottom: "20px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
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
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  stopButton: {
    padding: "12px 16px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
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
    color: "#374151",
    fontWeight: "500",
  },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [tab, setTab] = useState("file"); // "file" | "camera"
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // カメラ停止
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // タブ切替時にカメラ停止・状態リセット
  const handleTabChange = (newTab) => {
    stopCamera();
    setTab(newTab);
    handleClear();
  };

  // アンマウント時にカメラ停止
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setStatus(null);
    } catch {
      setStatus({ type: "error", message: "カメラへのアクセスが拒否されました。" });
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const fileName = `camera_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setUploadedUrl(null);
      setProgress(0);
      setStatus(null);
      stopCamera();
    }, "image/jpeg");
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ type: "error", message: "Please select a valid image file." });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus(null);
    setUploadedUrl(null);
    setProgress(0);
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus(null);
    setUploadedUrl(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus({ type: "error", message: "Please select an image first." });
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      setStatus({
        type: "error",
        message: "VITE_API_URL is not set. Create a .env file based on .env.example.",
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(10);
      setStatus({ type: "info", message: "Getting upload URL..." });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      let data = await response.json();
      console.log("Lambda response:", data);

      if (typeof data.body === "string") {
        data = JSON.parse(data.body);
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      setProgress(50);
      setStatus({ type: "info", message: "Uploading to S3..." });

      const s3Response = await fetch(data.presignedUrl, {
        method: "PUT",
        body: selectedFile,
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed with status ${s3Response.status}`);
      }

      setProgress(100);
      setUploadedUrl(data.url);
      setStatus({ type: "success", message: "Image uploaded successfully!" });
    } catch (err) {
      setStatus({ type: "error", message: `Upload failed: ${err.message}` });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = () => {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isButtonDisabled = !selectedFile || uploading;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Image Uploader</h1>
        <p style={styles.subtitle}>Upload images directly to AWS S3</p>

        {/* Tabs */}
        <div style={styles.tabContainer}>
          <button style={styles.tab(tab === "file")} onClick={() => handleTabChange("file")}>
            ファイル選択
          </button>
          <button style={styles.tab(tab === "camera")} onClick={() => handleTabChange("camera")}>
            カメラで撮影
          </button>
        </div>

        {/* ---- ファイル選択タブ ---- */}
        {tab === "file" && (
          <>
            {!selectedFile && (
              <div
                style={{ ...styles.dropZone, ...(isDragging ? styles.dropZoneHover : {}) }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div style={styles.dropZoneIcon}>{isDragging ? "📂" : "🖼️"}</div>
                <div style={{ fontSize: "15px", color: "#374151", fontWeight: "500" }}>
                  Drag & drop your image here
                </div>
                <div style={styles.dropZoneText}>
                  or <span style={styles.browseLink}>browse files</span>
                </div>
                <div style={{ ...styles.dropZoneText, marginTop: "6px", fontSize: "12px" }}>
                  Supports: JPG, PNG, GIF, WEBP, SVG
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={styles.fileInput}
              onChange={handleInputChange}
            />
          </>
        )}

        {/* ---- カメラタブ ---- */}
        {tab === "camera" && !selectedFile && (
          <>
            {!cameraActive ? (
              <button style={styles.startCameraButton} onClick={startCamera}>
                📷　カメラを起動する
              </button>
            ) : (
              <>
                <div style={styles.cameraContainer}>
                  <video
                    ref={videoRef}
                    style={styles.cameraVideo}
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
                <div style={styles.cameraControls}>
                  <button style={styles.captureButton} onClick={handleCapture}>
                    撮影する
                  </button>
                  <button style={styles.stopButton} onClick={stopCamera}>
                    停止
                  </button>
                </div>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}

        {/* 共通: プレビュー */}
        {selectedFile && previewUrl && (
          <div style={styles.previewContainer}>
            <img src={previewUrl} alt="Preview" style={styles.previewImage} />
            <div style={styles.previewInfo}>
              <span>
                <strong>{selectedFile.name}</strong> — {formatFileSize(selectedFile.size)}
              </span>
              <button style={styles.clearBtn} onClick={handleClear}>
                Remove
              </button>
            </div>
          </div>
        )}

        {/* 共通: プログレスバー */}
        {uploading && progress > 0 && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <div style={styles.progressText}>{progress}%</div>
          </div>
        )}

        {/* 共通: ステータス */}
        {status && (
          <div style={styles.statusBox(status.type)}>{status.message}</div>
        )}

        {/* 共通: アップロードボタン */}
        <button
          style={{
            ...styles.uploadButton,
            ...(isButtonDisabled ? styles.uploadButtonDisabled : {}),
            ...(btnHover && !isButtonDisabled ? styles.uploadButtonHover : {}),
          }}
          onClick={handleUpload}
          disabled={isButtonDisabled}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>

        {/* 共通: 結果 */}
        {uploadedUrl && (
          <div style={styles.resultBox}>
            <div style={styles.resultLabel}>Uploaded Image URL</div>
            <div style={styles.resultUrlContainer}>
              <span style={styles.resultUrl}>{uploadedUrl}</span>
              <button style={styles.copyBtn} onClick={handleCopyUrl}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div style={styles.resultImageContainer}>
              <img src={uploadedUrl} alt="Uploaded" style={styles.resultImage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
