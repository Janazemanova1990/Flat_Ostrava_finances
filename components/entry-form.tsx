"use client";
import { useState } from "react";
import { Check, CalendarClock } from "lucide-react";
import { InvoiceUpload } from "@/components/invoice-upload";
import { CATEGORIES, todayISO, type Section } from "@/lib/constants";

type Props = {
  section: Section;
  onSave: () => void;
  onCancel: () => void;
};

type Draft = {
  date: string;
  category: string;
  description: string;
  amount: string;
  recurring: boolean;
  taxDeductible: boolean;
  notes: string;
  invoiceUrl: string | null;
  invoiceFilename: string | null;
};

export function EntryForm({ section, onSave, onCancel }: Props) {
  const categories = CATEGORIES[section];
  const [draft, setDraft] = useState<Draft>({
    date: todayISO(),
    category: categories[0],
    description: "",
    amount: "",
    recurring: false,
    taxDeductible: false,
    notes: "",
    invoiceUrl: null,
    invoiceFilename: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const showRecurring = section !== "purchase";
  const showTax = section !== "purchase";

  async function handleSave() {
    if (!draft.amount || Number(draft.amount) <= 0) { setError("Amount required"); return; }
    setSaving(true);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, section, amount: Number(draft.amount) }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save"); return; }
    onSave();
  }

  const inputClass = "w-full bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]";
  const labelClass = "block text-xs text-[#5f7a5f] uppercase tracking-wider font-semibold mb-1";

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" className={inputClass} value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount (Kč)</label>
          <input type="number" className={inputClass} value={draft.amount} placeholder="0"
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input className={inputClass} value={draft.description} placeholder="Optional"
            onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass}>Notes (optional)</label>
          <input className={inputClass} value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
      </div>

      {(showRecurring || showTax) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {showRecurring && (
            <label className="flex items-center gap-2.5 bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={draft.recurring}
                onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })}
                className="accent-[#3d5c3d] w-4 h-4" />
              <CalendarClock size={14} className="text-[#3d5c3d]" />
              <div>
                <div className="text-sm font-medium text-[#2d3b2d]">Monthly recurring</div>
                <div className="text-xs text-[#8faa8f]">Used for cash flow calculations</div>
              </div>
            </label>
          )}
          {showTax && (
            <label className="flex items-center gap-2.5 bg-[#f5e8e8] border border-[#e8c8c8] rounded-lg px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={draft.taxDeductible}
                onChange={(e) => setDraft({ ...draft, taxDeductible: e.target.checked })}
                className="accent-[#8b4a4a] w-4 h-4" />
              <div>
                <div className="text-sm font-medium text-[#2d3b2d]">Tax deductible</div>
                <div className="text-xs text-[#c17a7a]">Included in tax export</div>
              </div>
            </label>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className={labelClass}>Invoice / receipt</label>
        <InvoiceUpload
          value={draft.invoiceUrl ? { url: draft.invoiceUrl, filename: draft.invoiceFilename! } : null}
          onChange={(v) => setDraft({ ...draft, invoiceUrl: v?.url ?? null, invoiceFilename: v?.filename ?? null })}
        />
      </div>

      {error && <p className="text-sm text-[#8b4a4a] mb-3">{error}</p>}

      <div className="flex gap-2 pt-3 border-t border-[#e8f0e8]">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          <Check size={14} /> {saving ? "Saving…" : "Save entry"}
        </button>
        <button onClick={onCancel} className="text-[#8faa8f] hover:text-[#2d3b2d] px-3 py-2 rounded-lg text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
