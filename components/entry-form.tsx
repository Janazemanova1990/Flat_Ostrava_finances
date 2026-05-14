"use client";
import { useState } from "react";
import { Check, CalendarClock, Paperclip, FileText, X } from "lucide-react";
import { InvoiceUpload } from "@/components/invoice-upload";
import { CATEGORIES, todayISO, type Section } from "@/lib/constants";
import type { Entry } from "@/db/schema";

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
  entry?: Entry;
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

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const showRecurring = section !== "purchase";
  const showTax = section !== "purchase";

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
    "w-full bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]";
  const labelClass =
    "block text-xs text-[#5f7a5f] uppercase tracking-wider font-semibold mb-1";

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-[#8faa8f] mb-3">
        {isEdit ? "Edit entry" : "New entry"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            className={inputClass}
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select
            className={inputClass}
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value, recurring: e.target.value === "Rent" ? true : draft.recurring })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount (Kč)</label>
          <input
            type="number"
            className={inputClass}
            value={draft.amount}
            placeholder="0"
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            className={inputClass}
            value={draft.description}
            placeholder="Optional"
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass}>Notes</label>
          <textarea
            className={`${inputClass} resize-none`}
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
            <label className="flex items-center gap-2.5 bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.recurring}
                onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })}
                className="accent-[#3d5c3d] w-4 h-4"
              />
              <CalendarClock size={14} className="text-[#3d5c3d]" />
              <div>
                <div className="text-sm font-medium text-[#2d3b2d]">Monthly recurring</div>
                <div className="text-xs text-[#8faa8f]">Used for cash flow calculations</div>
              </div>
            </label>
          )}
          {showTax && (
            <label className="flex items-center gap-2.5 bg-[#f5e8e8] border border-[#e8c8c8] rounded-lg px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.taxDeductible}
                onChange={(e) => setDraft({ ...draft, taxDeductible: e.target.checked })}
                className="accent-[#8b4a4a] w-4 h-4"
              />
              <div>
                <div className="text-sm font-medium text-[#2d3b2d]">Tax deductible</div>
                <div className="text-xs text-[#c17a7a]">Included in tax export</div>
              </div>
            </label>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className={labelClass}>Invoice / receipt</label>
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

      <div className="mb-4">
        <label className={labelClass}>Additional files</label>
        <label
          className={`flex items-center gap-3 border-2 border-dashed border-[#b8d0b8] rounded-lg px-3 py-2.5 cursor-pointer hover:border-[#3d5c3d] hover:bg-[#edf3ed] transition`}
        >
          <div className="w-7 h-7 bg-[#e8f0e8] rounded-lg flex items-center justify-center flex-shrink-0">
            <Paperclip size={14} className="text-[#3d5c3d]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[#2d3b2d]">Attach more files</div>
            <div className="text-xs text-[#8faa8f]">PDF, JPG, PNG, HEIC — max 10 MB each</div>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.heic,image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
        {fileError && <p className="text-xs text-[#8b4a4a] mt-1">{fileError}</p>}
        {pendingFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            {pendingFiles.map((pf, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-[#f4f7f4] rounded-lg px-3 py-1.5">
                <FileText size={12} className="text-[#3d5c3d] flex-shrink-0" />
                <span className="flex-1 truncate text-[#2d3b2d]">{pf.file.name}</span>
                {pf.status === "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-[#8faa8f] hover:text-[#8b4a4a]"
                  >
                    <X size={12} />
                  </button>
                )}
                {pf.status === "uploading" && (
                  <span className="text-[#8faa8f]">Uploading…</span>
                )}
                {pf.status === "done" && (
                  <span className="text-[#2d6a2d]">✓ Uploaded</span>
                )}
                {pf.status === "error" && (
                  <span className="text-[#8b4a4a]">{pf.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[#8b4a4a] mb-3">{error}</p>}

      <div className="flex gap-2 pt-3 border-t border-[#e8f0e8]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          <Check size={14} />
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </button>
        <button
          onClick={onCancel}
          className="text-[#8faa8f] hover:text-[#2d3b2d] px-3 py-2 rounded-lg text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
