"use client";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { EntryForm } from "@/components/entry-form";
import { CategoryGroup } from "@/components/category-group";
import { useRouter } from "next/navigation";
import { fmtCZK, type Section } from "@/lib/constants";
import type { Entry } from "@/db/schema";

type Props = {
  title: string;
  subtitle: string;
  section: Section;
  entries: Entry[];
  color: "sage" | "income";
};

export function EntrySection({ title, subtitle, section, entries, color }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  const grouped = useMemo(() => {
    const g: Record<string, Entry[]> = {};
    entries.forEach((e) => { (g[e.category] ??= []).push(e); });
    return g;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl font-medium text-[#2d3b2d] mb-1">{title}</h2>
          <p className="text-sm text-[#5f7a5f] max-w-xl">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-[#8faa8f]">Total</div>
          <div className={`font-display text-2xl font-medium tabular-nums ${totalColor}`}>{fmtCZK(total)}</div>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium">
        <Plus size={14} /> Add entry
      </button>

      {showForm && (
        <EntryForm
          section={section}
          onSave={() => { setShowForm(false); router.refresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-[#d4e0d4] rounded-xl p-12 text-center text-[#8faa8f] text-sm">
          No entries yet. Click "Add entry" to start tracking.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <CategoryGroup key={cat} category={cat} entries={items} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}
