import { EntryRow } from "@/components/entry-row";
import { fmtCZK } from "@/lib/constants";
import type { EntryWithAttachments } from "@/db/schema";

type Props = {
  category: string;
  entries: EntryWithAttachments[];
  color: "sage" | "income";
  onEdit: (entry: EntryWithAttachments) => void;
};

export function CategoryGroup({ category, entries, color, onEdit }: Props) {
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalColor = color === "income" ? "#3D8070" : "#D4684A";

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E2D9CC" }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: "rgba(30,58,74,0.05)", borderBottom: "1px solid #E2D9CC" }}>
        <span className="text-sm font-semibold" style={{ color: "#1E3A4A" }}>{category}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: totalColor }}>{fmtCZK(total)}</span>
      </div>
      <div className="divide-y" style={{ borderColor: "#E2D9CC" }}>
        {entries
          .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
          .map((e) => (
            <EntryRow key={e.id} entry={e} color={color} onEdit={() => onEdit(e)} />
          ))}
      </div>
    </div>
  );
}
