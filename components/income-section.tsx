"use client";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { fmtCZK } from "@/lib/constants";
import { EntryForm } from "@/components/entry-form";
import { EntryRow } from "@/components/entry-row";
import type { EntryWithAttachments } from "@/db/schema";

function groupByMonth(entries: EntryWithAttachments[]) {
  const groups: { label: string; entries: EntryWithAttachments[] }[] = [];
  const seen = new Map<string, EntryWithAttachments[]>();
  for (const e of entries) {
    const [y, m] = e.date.split("-");
    const key = `${y}-${m}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(e);
  }
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (const [key, items] of seen) {
    const [y, m] = key.split("-").map(Number);
    groups.push({ label: `${monthNames[m - 1]} ${y}`, entries: items });
  }
  return groups;
}

type Props = { entries: EntryWithAttachments[] };

export function IncomeSection({ entries }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
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
        <h2 className="font-display text-3xl font-medium mb-1" style={{ color: "#1E3A4A" }}>Income</h2>
        <p className="text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>
          Rent, deposits, reimbursements. Flag recurring rent for yield calculations.
        </p>
      </div>

      {!editingEntry && (
        <div className="flex items-end justify-between gap-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#3D8070", color: "#FFFFFF" }}
          >
            <Plus size={14} /> Add income
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
        <EntryForm
          section="income"
          onSave={handleSave}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingEntry && (
        <EntryForm
          section="income"
          entry={editingEntry}
          onSave={handleSave}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-sm" style={{ border: "1px solid #E2D9CC", color: "rgba(30,58,74,0.5)" }}>
          No income yet. Click &quot;Add income&quot; to start tracking.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ label, entries: monthEntries }) => {
            const monthTotal = monthEntries.reduce((s, e) => s + Number(e.amount), 0);
            return (
              <div key={label} className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E2D9CC" }}>
                <div className="flex items-center justify-between px-4 sm:px-5 py-2.5" style={{ background: "#F5F0E8", borderBottom: "1px solid #E2D9CC" }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(30,58,74,0.5)" }}>{label}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "#3D8070" }}>{fmtCZK(monthTotal)}</span>
                </div>
                <div className="divide-y divide-[#E2D9CC]">
                  {monthEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      color="income"
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
