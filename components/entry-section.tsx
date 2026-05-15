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
  const totalColor = color === "income" ? "#3D8070" : "#1E3A4A";

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
        <h2 className="font-display text-3xl font-medium mb-1" style={{ color: "#1E3A4A" }}>{title}</h2>
        <p className="text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>{subtitle}</p>
      </div>

      {!editingEntry && (
        <div className="flex items-end justify-between gap-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#D4684A", color: "#FFFFFF" }}
          >
            <Plus size={14} /> Add entry
          </button>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest" style={{ color: "rgba(30,58,74,0.5)" }}>Total</div>
            <div className="font-display text-2xl font-medium tabular-nums" style={{ color: totalColor }}>
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
        <div className="bg-white rounded-xl p-12 text-center text-sm" style={{ border: "1px solid #E2D9CC", color: "rgba(30,58,74,0.5)" }}>
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
