"use client";
import { useState } from "react";
import { Check, CalendarClock, Paperclip, FileText, X } from "lucide-react";
import { InvoiceUpload } from "@/components/invoice-upload";
import { CATEGORIES, todayISO, type Section } from "@/lib/constants";
import type { Entry, EntryWithAttachments } from "@/db/schema";

type PendingFile = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type Draft = {
  date: string;
  category: string;
  description: string;
  amount: string;
  recurring: boolean;
  taxDeductible: boolean;
  notes: string;
  invoiceUrl: string | null;
  invoiceFilename: string | null;
};

type Props = {
  section: Section;
  entry?: EntryWithAttachments;
  onSave: () => void;
  onCancel: () => void;
};

export function EntryForm({ section, entry, onSave, onCancel }: Props) {
  const categories = CATEGORIES[section];
  const isEdit = !!entry;

  const [draft, setDraft] = useState<Draft>(() =>
    entry
      ? {
          date: entry.date,
          category: entry.category,
          description: entry.description ?? "",
          amount: String(Number(entry.amount)),
          recurring: entry.recurring,
          taxDeductible: entry.taxDeductible,
          notes: entry.notes ?? "",
          invoiceUrl: entry.invoiceUrl ?? null,
          invoiceFilename: entry.invoiceFilename ?? null,
        }
      : {
          date: todayISO(),
          category: categories[0],
          description: "",
          amount: "",
          recurring: categories[0] === "Rent",
          taxDeductible: false,
          notes: "",
          invoiceUrl: null,
          invoiceFilename: null,
        }
  );

  const [existingAttachments, setExistingAttachments] = useState(entry?.attachments ?? []);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAttachment(id: string) {
    await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  const showRecurring = section !== "purchase";
  const showTax = true;

  async function uploadFiles(entryId: string) {
    for (let i = 0; i < pendingFiles.length; i++) {
      if (pendingFiles[i].status !== "pending") continue;
      setPendingFiles((prev) =>
        prev.map((f, j) => (j === i ? { ...f, status: "uploading" } : f))
      );
      const form = new FormData();
      form.append("file", pendingFiles[i].file);
      form.append("entryId", entryId);
      const res = await fetch("/api/attachments", { method: "POST", body: form });
      if (res.ok) {
        setPendingFiles((prev) =>
          prev.map((f, j) => (j === i ? { ...f, status: "done" } : f))
        );
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setPendingFiles((prev) =>
          prev.map((f, j) =>
            j === i ? { ...f, status: "error", error: data.error ?? "Upload failed" } : f
          )
        );
      }
    }
  }

  async function handleSave() {
    if (!draft.amount || Number(draft.amount) <= 0) {
      setError("Amount required");
      return;
    }
    setSaving(true);
    setError("");

    if (isEdit) {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, amount: Number(draft.amount) }),
      });
      if (!res.ok) { setSaving(false); setError("Failed to save"); return; }
      if (pendingFiles.some((f) => f.status === "pending")) {
        await uploadFiles(entry.id);
      }
    } else {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, section, amount: Number(draft.amount) }),
      });
      if (!res.ok) { setSaving(false); setError("Failed to save"); return; }
      const { entry: created } = await res.json();
      if (pendingFiles.some((f) => f.status === "pending")) {
        await uploadFiles(created.id);
      }
    }

    setSaving(false);
    onSave();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const files = Array.from(e.target.files ?? []);
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      setFileError(`${oversized.length} file(s) exceed 10 MB limit`);
    }
    const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
    setPendingFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({ file: f, status: "pending" as const })),
    ]);
    e.target.value = "";
  }

  const inputClass =
    "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#1E3A4A]";
  const inputStyle = {
    background: "#F5F0E8",
    border: "1px solid #E2D9CC",
    color: "#1E3A4A",
  };
  const labelClass =
    "block text-xs uppercase tracking-wider font-semibold mb-1";
  const labelStyle = { color: "rgba(30,58,74,0.6)" };

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E2D9CC" }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(30,58,74,0.5)" }}>
        {isEdit ? "Edit entry" : "New entry"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div>
          <label className={labelClass} style={labelStyle}>Date</label>
          <input
            type="date"
            className={inputClass}
            style={inputStyle}
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Category</label>
          <select
            className={inputClass}
            style={inputStyle}
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value, recurring: e.target.value === "Rent" ? true : draft.recurring })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Amount (Kč)</label>
          <input
            type="number"
            className={inputClass}
            style={inputStyle}
            value={draft.amount}
            placeholder="0"
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Description</label>
          <input
            className={inputClass}
            style={inputStyle}
            value={draft.description}
            placeholder="Optional"
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass} style={labelStyle}>Notes</label>
          <textarea
            className={`${inputClass} resize-none`}
            style={inputStyle}
            rows={2}
            value={draft.notes}
            placeholder="Reference numbers, context, anything useful…"
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </div>
      </div>

      {(showRecurring || showTax) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {showRecurring && (
            <label className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer" style={{ background: "#F5F0E8", border: "1px solid #E2D9CC" }}>
              <input
                type="checkbox"
                checked={draft.recurring}
                onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })}
                className="accent-[#3D8070] w-4 h-4"
              />
              <CalendarClock size={14} style={{ color: "#3D8070" }} />
              <div>
                <div className="text-sm font-medium" style={{ color: "#1E3A4A" }}>Monthly recurring</div>
                <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>Used for cash flow calculations</div>
              </div>
            </label>
          )}
          {showTax && (
            <label className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer" style={{ background: "rgba(212,104,74,0.08)", border: "1px solid rgba(212,104,74,0.2)" }}>
              <input
                type="checkbox"
                checked={draft.taxDeductible}
                onChange={(e) => setDraft({ ...draft, taxDeductible: e.target.checked })}
                className="accent-[#D4684A] w-4 h-4"
              />
              <div>
                <div className="text-sm font-medium" style={{ color: "#1E3A4A" }}>Tax deductible</div>
                <div className="text-xs" style={{ color: "#D4684A" }}>Included in tax export</div>
              </div>
            </label>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className={labelClass} style={labelStyle}>Invoice / receipt</label>
        <InvoiceUpload
          value={
            draft.invoiceUrl
              ? { url: draft.invoiceUrl, filename: draft.invoiceFilename! }
              : null
          }
          onChange={(v) =>
            setDraft({
              ...draft,
              invoiceUrl: v?.url ?? null,
              invoiceFilename: v?.filename ?? null,
            })
          }
        />
      </div>

      {existingAttachments.length > 0 && (
        <div className="mb-3">
          <label className={labelClass} style={labelStyle}>Attached files</label>
          <div className="space-y-1">
            {existingAttachments.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5" style={{ background: "#F5F0E8" }}>
                <FileText size={12} className="flex-shrink-0" style={{ color: "#3D8070" }} />
                <a
                  href={`/api/blob-download?url=${encodeURIComponent(a.blobUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate hover:underline"
                  style={{ color: "#1E3A4A" }}
                >
                  {a.filename}
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteAttachment(a.id)}
                  style={{ color: "rgba(30,58,74,0.4)" }}
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className={labelClass} style={labelStyle}>Add more files</label>
        <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition" style={{ border: "2px dashed #E2D9CC" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(61,128,112,0.1)" }}>
            <Paperclip size={14} style={{ color: "#3D8070" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm" style={{ color: "#1E3A4A" }}>Attach more files</div>
            <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>PDF, JPG, PNG, HEIC - max 10 MB each</div>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.heic,image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
        {fileError && <p className="text-xs mt-1" style={{ color: "#D4684A" }}>{fileError}</p>}
        {pendingFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            {pendingFiles.map((pf, i) => (
              <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5" style={{ background: "#F5F0E8" }}>
                <FileText size={12} className="flex-shrink-0" style={{ color: "#3D8070" }} />
                <span className="flex-1 truncate" style={{ color: "#1E3A4A" }}>{pf.file.name}</span>
                {pf.status === "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    style={{ color: "rgba(30,58,74,0.4)" }}
                  >
                    <X size={12} />
                  </button>
                )}
                {pf.status === "uploading" && (
                  <span style={{ color: "rgba(30,58,74,0.5)" }}>Uploading…</span>
                )}
                {pf.status === "done" && (
                  <span style={{ color: "#3D8070" }}>✓ Uploaded</span>
                )}
                {pf.status === "error" && (
                  <span style={{ color: "#D4684A" }}>{pf.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm mb-3" style={{ color: "#D4684A" }}>{error}</p>}

      <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid #E2D9CC" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: "#1E3A4A", color: "#F5F0E8" }}
        >
          <Check size={14} />
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ color: "rgba(30,58,74,0.5)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
