"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Paperclip, ChevronDown } from "lucide-react";
import { fmtCZK } from "@/lib/constants";
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
    ? "text-[#6d28d9]"
    : color === "income"
    ? "text-[#2d6a2d]"
    : "text-[#2d3b2d]";

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
            <span className="text-sm font-medium text-[#2d3b2d] truncate">
              {entry.description || entry.category}
            </span>
            {allAttachments.length > 0 && (
              <span className="flex items-center gap-0.5 text-[#8faa8f] shrink-0">
                <Paperclip size={11} />
                <span className="text-xs">{allAttachments.length}</span>
              </span>
            )}
            {hasDetail && (
              <ChevronDown
                size={12}
                className={`text-[#8faa8f] shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-[#8faa8f]">{entry.date}</span>
            {entry.taxDeductible && (
              <span className="text-xs text-[#8b4a4a]">· ⊛ tax deductible</span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-medium tabular-nums ${amountColor}`}>
            {isRecurring && <span className="mr-1">↻</span>}{fmtCZK(Number(entry.amount))}
          </span>
          <button
            onClick={onEdit}
            className="text-[#8faa8f] hover:text-[#3d5c3d] p-1 rounded"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="text-[#8faa8f] hover:text-[#8b4a4a] p-1 rounded"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && hasDetail && (
        <div className="mt-2 pt-2 border-t border-[#f0f5f0] space-y-2">
          {entry.notes && (
            <p className="text-xs text-[#5f7a5f]">{entry.notes}</p>
          )}
          {allAttachments.length > 0 && (
            <div className="flex flex-col gap-1">
              {allAttachments.map((a) => (
                <a
                  key={a.id}
                  href={`/api/blob-download?url=${encodeURIComponent(a.blobUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#5f7a5f] hover:text-[#3d5c3d] transition-colors"
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
