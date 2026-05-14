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
      <div className="flex items-center gap-3 bg-white border border-[#d4e0d4] rounded-lg px-3 py-2.5">
        <FileText size={16} className="text-[#3d5c3d] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <a href={`/api/blob-download?url=${encodeURIComponent(value.url)}`} target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium text-[#2d3b2d] hover:text-[#3d5c3d] truncate block">
            {value.filename}
          </a>
        </div>
        <button onClick={handleRemove} className="text-[#8b4a4a] hover:text-[#2d3b2d]">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <label className={`flex items-center gap-3 border-2 border-dashed border-[#b8d0b8] rounded-lg px-3 py-3 cursor-pointer hover:border-[#3d5c3d] hover:bg-[#edf3ed] transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="w-8 h-8 bg-[#e8f0e8] rounded-lg flex items-center justify-center flex-shrink-0">
        <Paperclip size={15} className="text-[#3d5c3d]" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-[#2d3b2d]">
          {uploading ? "Uploading…" : "Attach invoice or receipt"}
        </div>
        <div className="text-xs text-[#8faa8f]">PDF, JPG, PNG - max 10 MB</div>
      </div>
      <span className="bg-white border border-[#d4e0d4] text-[#3d5c3d] text-xs font-semibold px-3 py-1 rounded-md">
        Browse
      </span>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {error && <p className="text-xs text-[#8b4a4a] mt-1">{error}</p>}
    </label>
  );
}
