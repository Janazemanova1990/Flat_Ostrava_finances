"use client";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { EntryForm } from "@/components/entry-form";
import { CategoryGroup } from "@/components/category-group";
import { useRouter } from "next/navigation";
import { fmtCZK, type Section } from "@/lib/constants";
import type { EntryWithAttachments } from "@/db/schema";

type Props = {
  title: string;
  subtitle: string;
  section: Section;
  entries: EntryWithAttachments[];
  color: "sage" | "income";
};

export function EntrySection({ title, subtitle, section, entries, color }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryWithAttachments | null>(null);
  const router = useRouter();

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  const grouped = useMemo(() => {
    const g: Record<string, EntryWithAttachments[]> = {};
    entries.forEach((e) => { (g[e.category] ??= []).push(e); });
    return g;
  }, [entries]);

  function handleSave() {
    setShowAddForm(false);
    setEditingEntry(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-medium text-[#2d3b2d] mb-1">{title}</h2>
        <p className="text-sm text-[#5f7a5f]">{subtitle}</p>
      </div>

      {!editingEntry && (
        <div className="flex items-end justify-between gap-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={14} /> Add entry
          </button>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-[#8faa8f]">Total</div>
            <div className={`font-display text-2xl font-medium tabular-nums ${totalColor}`}>
              {fmtCZK(total)}
            </div>
          </div>
        </div>
      )}

      {showAddForm && !editingEntry && (
        <EntryForm
          section={section}
          onSave={handleSave}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingEntry && (
        <EntryForm
          section={section}
          entry={editingEntry}
          onSave={handleSave}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-[#d4e0d4] rounded-xl p-12 text-center text-[#8faa8f] text-sm">
          No entries yet. Click &quot;Add entry&quot; to start tracking.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <CategoryGroup
              key={cat}
              category={cat}
              entries={items}
              color={color}
              onEdit={(e) => {
                setShowAddForm(false);
                setEditingEntry(e);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
