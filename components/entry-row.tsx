"use client";
import { useRouter } from "next/navigation";
import { Trash2, CalendarClock, FileText } from "lucide-react";
import { fmtCZK } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export function EntryRow({ entry, color }: { entry: Entry; color: "sage" | "income" }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    router.refresh();
  }

  const amountColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
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
            <a href={entry.invoiceUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-wider bg-[#e8f0e8] text-[#3d5c3d] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-[#d4e0d4]">
              <FileText size={9} /> invoice
            </a>
          )}
        </div>
        <div className="text-xs text-[#8faa8f] mt-0.5">
          {entry.date}{entry.notes ? ` · ${entry.notes}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium tabular-nums ${amountColor}`}>
          {fmtCZK(Number(entry.amount))}
        </span>
        <button onClick={handleDelete} className="text-[#8faa8f] hover:text-[#8b4a4a] p-1 rounded">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
