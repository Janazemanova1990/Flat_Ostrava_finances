"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Paperclip, ChevronDown } from "lucide-react";
import { fmtCZK, fmtDate } from "@/lib/constants";
import type { EntryWithAttachments } from "@/db/schema";

type Props = {
  entry: EntryWithAttachments;
  color: "sage" | "income";
  onEdit: () => void;
};

export function EntryRow({ entry, color, onEdit }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this entry and all its attachments?")) return;
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    router.refresh();
  }

  const isRecurring = entry.recurring;
  const amountColor = isRecurring
    ? "#1E3A4A"
    : color === "income"
    ? "#3D8070"
    : "#D4684A";

  const allAttachments = [
    ...(entry.invoiceUrl
      ? [{ id: "__legacy__", blobUrl: entry.invoiceUrl, filename: entry.invoiceFilename || "invoice" }]
      : []),
    ...entry.attachments,
  ];

  const hasDetail = !!entry.notes || allAttachments.length > 0;

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => hasDetail && setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate" style={{ color: "#1E3A4A" }}>
              {entry.description || entry.category}
            </span>
            {allAttachments.length > 0 && (
              <span className="flex items-center gap-0.5 shrink-0" style={{ color: "rgba(30,58,74,0.5)" }}>
                <Paperclip size={11} />
                <span className="text-xs">{allAttachments.length}</span>
              </span>
            )}
            {hasDetail && (
              <ChevronDown
                size={12}
                className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                style={{ color: "rgba(30,58,74,0.5)" }}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>{fmtDate(entry.date)}</span>
            {entry.taxDeductible && (
              <span className="text-xs" style={{ color: "#D4684A" }}>· ⊛ tax deductible</span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-medium tabular-nums" style={{ color: amountColor }}>
            {isRecurring && <span className="mr-1">↻</span>}{fmtCZK(Number(entry.amount))}
          </span>
          <button
            onClick={onEdit}
            className="p-1 rounded transition-colors"
            style={{ color: "rgba(30,58,74,0.4)" }}
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded transition-colors"
            style={{ color: "rgba(30,58,74,0.4)" }}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && hasDetail && (
        <div className="mt-2 pt-2 space-y-2" style={{ borderTop: "1px solid #E2D9CC" }}>
          {entry.notes && (
            <p className="text-xs" style={{ color: "rgba(30,58,74,0.6)" }}>{entry.notes}</p>
          )}
          {allAttachments.length > 0 && (
            <div className="flex flex-col gap-1">
              {allAttachments.map((a) => (
                <a
                  key={a.id}
                  href={`/api/blob-download?url=${encodeURIComponent(a.blobUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs transition-colors"
                  style={{ color: "#3D8070" }}
                >
                  <Paperclip size={11} />
                  <span className="truncate">{a.filename}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
