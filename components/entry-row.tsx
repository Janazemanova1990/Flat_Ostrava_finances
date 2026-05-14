"use client";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, CalendarClock, FileText, X } from "lucide-react";
import { fmtCZK } from "@/lib/constants";
import type { EntryWithAttachments } from "@/db/schema";

type Props = {
  entry: EntryWithAttachments;
  color: "sage" | "income";
  onEdit: () => void;
};

export function EntryRow({ entry, color, onEdit }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this entry and all its attachments?")) return;
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleDeleteAttachment(attachmentId: string) {
    await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
    router.refresh();
  }

  const amountColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#2d3b2d] truncate">
              {entry.description || entry.category}
            </span>
            {entry.recurring && (
              <span className="text-[10px] uppercase tracking-wider bg-[#e8f0e8] text-[#3d5c3d] px-2 py-0.5 rounded-full flex items-center gap-1">
                <CalendarClock size={9} /> monthly
              </span>
            )}
            {entry.taxDeductible && (
              <span className="text-[10px] uppercase tracking-wider bg-[#f5e8e8] text-[#8b4a4a] px-2 py-0.5 rounded-full">
                ⊛ tax
              </span>
            )}
            {entry.invoiceUrl && (
              <a
                href={`/api/blob-download?url=${encodeURIComponent(entry.invoiceUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-wider bg-[#e8f0e8] text-[#3d5c3d] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-[#d4e0d4]"
              >
                <FileText size={9} /> invoice
              </a>
            )}
          </div>
          <div className="text-xs text-[#8faa8f] mt-0.5">
            {entry.date}
            {entry.notes ? ` · ${entry.notes}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-medium tabular-nums ${amountColor}`}>
            {fmtCZK(Number(entry.amount))}
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

      {entry.attachments.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {entry.attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-1 bg-[#e8f0e8] text-[#3d5c3d] text-[10px] px-2 py-0.5 rounded-full"
            >
              <a
                href={`/api/blob-download?url=${encodeURIComponent(a.blobUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline max-w-[160px] truncate"
              >
                <FileText size={9} />
                {a.filename}
              </a>
              <button
                onClick={() => handleDeleteAttachment(a.id)}
                className="ml-0.5 text-[#3d5c3d] hover:text-[#8b4a4a]"
                title="Remove attachment"
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
