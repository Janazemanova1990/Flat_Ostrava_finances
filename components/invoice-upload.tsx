"use client";
import { useState } from "react";
import { Paperclip, FileText, X } from "lucide-react";

type Props = {
  value: { url: string; filename: string } | null;
  onChange: (val: { url: string; filename: string } | null) => void;
};

export function InvoiceUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Upload failed");
      return;
    }
    const { url, filename } = await res.json();
    onChange({ url, filename });
  }

  async function handleRemove() {
    if (!value) return;
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: value.url }),
    });
    onChange(null);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5" style={{ border: "1px solid #E2D9CC" }}>
        <FileText size={16} className="flex-shrink-0" style={{ color: "#3D8070" }} />
        <div className="flex-1 min-w-0">
          <a
            href={`/api/blob-download?url=${encodeURIComponent(value.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium truncate block hover:underline"
            style={{ color: "#1E3A4A" }}
          >
            {value.filename}
          </a>
        </div>
        <button onClick={handleRemove} style={{ color: "#D4684A" }}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <label className={`flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer transition ${uploading ? "opacity-50 pointer-events-none" : ""}`} style={{ border: "2px dashed #E2D9CC" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(61,128,112,0.1)" }}>
        <Paperclip size={15} style={{ color: "#3D8070" }} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: "#1E3A4A" }}>
          {uploading ? "Uploading…" : "Attach invoice or receipt"}
        </div>
        <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>PDF, JPG, PNG - max 10 MB</div>
      </div>
      <span className="bg-white text-xs font-semibold px-3 py-1 rounded-md" style={{ border: "1px solid #E2D9CC", color: "#3D8070" }}>
        Browse
      </span>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {error && <p className="text-xs mt-1" style={{ color: "#D4684A" }}>{error}</p>}
    </label>
  );
}
