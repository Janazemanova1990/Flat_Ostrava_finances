import { EntryRow } from "@/components/entry-row";
import { fmtCZK } from "@/lib/constants";
import type { Entry } from "@/db/schema";

type Props = {
  category: string;
  entries: Entry[];
  color: "sage" | "income";
};

export function CategoryGroup({ category, entries, color }: Props) {
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-[#edf3ed] border-b border-[#d4e0d4] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#3d5c3d]">{category}</span>
        <span className={`text-sm font-semibold tabular-nums ${totalColor}`}>{fmtCZK(total)}</span>
      </div>
      <div className="divide-y divide-[#f0f5f0]">
        {entries
          .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
          .map((e) => <EntryRow key={e.id} entry={e} color={color} />)}
      </div>
    </div>
  );
}
