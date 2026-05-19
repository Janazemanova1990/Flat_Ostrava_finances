"use client";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { fmtCZK } from "@/lib/constants";
import { EntryForm } from "@/components/entry-form";
import { EntryRow } from "@/components/entry-row";
import type { EntryWithAttachments } from "@/db/schema";
import type { Section } from "@/lib/constants";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function groupByMonth(entries: EntryWithAttachments[]) {
  const seen = new Map<string, EntryWithAttachments[]>();
  for (const e of entries) {
    const [y, m] = e.date.split("-");
    const key = `${y}-${m}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(e);
  }
  return Array.from(seen.entries()).map(([key, items]) => {
    const [y, m] = key.split("-").map(Number);
    return { label: `${MONTH_NAMES[m - 1]} ${y}`, entries: items };
  });
}

type Props = { entries: EntryWithAttachments[] };

export function CombinedExpensesSection({ entries }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addSection, setAddSection] = useState<Section>("ongoing");
  const [editingEntry, setEditingEntry] = useState<EntryWithAttachments | null>(null);
  const router = useRouter();

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const grouped = useMemo(() => groupByMonth(entries), [entries]);

  function handleSave() {
    setShowAddForm(false);
    setEditingEntry(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-medium mb-1" style={{ color: "#1E3A4A" }}>Expenses</h2>
        <p className="text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>
          All purchase costs and ongoing expenses. Flag recurring ones and mark tax-deductible entries for your accountant.
        </p>
      </div>

      {!editingEntry && (
        <div className="flex items-end justify-between gap-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#D4684A", color: "#FFFFFF" }}
          >
            <Plus size={14} /> Add expense
          </button>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest" style={{ color: "rgba(30,58,74,0.5)" }}>Total</div>
            <div className="font-sans text-2xl font-semibold tabular-nums" style={{ color: "#1E3A4A" }}>
              {fmtCZK(total)}
            </div>
          </div>
        </div>
      )}

      {showAddForm && !editingEntry && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E2D9CC" }}>
          <div className="flex gap-2 px-5 pt-4 pb-0">
            {(["ongoing", "purchase"] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => setAddSection(s)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={
                  addSection === s
                    ? { background: "#1E3A4A", color: "#F5F0E8" }
                    : { background: "rgba(30,58,74,0.08)", color: "rgba(30,58,74,0.6)" }
                }
              >
                {s === "ongoing" ? "Ongoing expense" : "Purchase cost"}
              </button>
            ))}
          </div>
          <div className="p-5 pt-3">
            <EntryForm
              section={addSection}
              onSave={handleSave}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {editingEntry && (
        <EntryForm
          section={editingEntry.section as Section}
          entry={editingEntry}
          onSave={handleSave}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-sm" style={{ border: "1px solid #E2D9CC", color: "rgba(30,58,74,0.5)" }}>
          No entries yet. Click &quot;Add expense&quot; to start tracking.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ label, entries: monthEntries }) => {
            const monthTotal = monthEntries.reduce((s, e) => s + Number(e.amount), 0);
            return (
              <div key={label} className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E2D9CC" }}>
                <div className="flex items-center justify-between px-4 sm:px-5 py-2.5" style={{ background: "#F5F0E8", borderBottom: "1px solid #E2D9CC" }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(30,58,74,0.5)" }}>{label}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "#D4684A" }}>{fmtCZK(monthTotal)}</span>
                </div>
                <div className="divide-y divide-[#E2D9CC]">
                  {monthEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      color="sage"
                      showSectionBadge
                      onEdit={() => {
                        setShowAddForm(false);
                        setEditingEntry(entry);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
