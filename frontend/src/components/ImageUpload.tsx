import { useState, useRef } from "react";
import axios from "axios";

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT as string;

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("idle");
    setMessage("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    setFile(dropped);
    setPreview(URL.createObjectURL(dropped));
    setStatus("idle");
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setMessage("");

    try {
      // Base64エンコードしてAPI Gatewayへ送信
      const base64 = await toBase64(file);

      await axios.post(API_ENDPOINT, {
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
      });

      setStatus("success");
      setMessage("アップロード成功しました！");
    } catch {
      setStatus("error");
      setMessage("アップロードに失敗しました。");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="upload-container">
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="preview-image" />
        ) : (
          <p>クリックまたはドラッグ&amp;ドロップで画像を選択</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {file && (
        <p className="file-name">
          {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </p>
      )}

      <div className="button-group">
        <button
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className="btn btn-primary"
        >
          {status === "uploading" ? "アップロード中..." : "アップロード"}
        </button>
        <button onClick={handleReset} className="btn btn-secondary">
          リセット
        </button>
      </div>

      {message && (
        <p className={`message ${status === "success" ? "success" : "error"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // "data:image/png;base64,..." の base64部分のみ抽出
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
