"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtCZK } from "@/lib/constants";
import type { Meta } from "@/db/schema";

export function PropertyValueCard({ meta }: { meta: Meta }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();

  const purchasePrice = Number(meta.purchasePrice);
  const currentValue = Number(meta.currentPropertyValue ?? 0);
  const hasEstimate = currentValue > 0;
  const gainCZK = currentValue - purchasePrice;
  const gainPct = purchasePrice > 0 ? (gainCZK / purchasePrice) * 100 : 0;
  const updatedAt = meta.currentPropertyValueUpdatedAt
    ? new Date(meta.currentPropertyValueUpdatedAt).toLocaleDateString("cs-CZ")
    : null;

  async function saveEstimate() {
    const num = Number(value);
    if (!num || num <= 0) return;
    await fetch("/api/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPropertyValue: num }),
    });
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#2d3b2d]">Property value</span>
        {!editing && (
          <button onClick={() => { setValue(String(currentValue || "")); setEditing(true); }}
            className="text-xs text-[#3d5c3d] border border-[#d4e0d4] rounded-lg px-3 py-1 hover:bg-[#f4f7f4]">
            {hasEstimate ? "Update estimate" : "Add estimate"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="Current estimate (Kč)"
            className="flex-1 bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]" />
          <button onClick={saveEstimate} className="bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium">Save</button>
          <button onClick={() => setEditing(false)} className="text-[#8faa8f] px-3 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      ) : hasEstimate ? (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Purchased at</div>
            <div className="font-display text-xl font-medium text-[#2d3b2d]">{fmtCZK(purchasePrice)}</div>
          </div>
          <div className="text-[#8faa8f] text-xl">→</div>
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Current estimate</div>
            <div className="font-display text-xl font-medium text-[#2d3b2d]">{fmtCZK(currentValue)}</div>
          </div>
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Gain</div>
            <div className={`font-display text-xl font-medium ${gainCZK >= 0 ? "text-[#2d6a2d]" : "text-[#8b4a4a]"}`}>
              {gainCZK >= 0 ? "+" : ""}{fmtCZK(gainCZK)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Return</div>
            <div className={`font-display text-xl font-medium ${gainPct >= 0 ? "text-[#2d6a2d]" : "text-[#8b4a4a]"}`}>
              {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#8faa8f]">
          No estimate yet. Add a current market value from Sreality.cz to track appreciation.
        </p>
      )}
      {updatedAt && !editing && (
        <div className="text-[10px] text-[#8faa8f] mt-3">Last updated: {updatedAt}</div>
      )}
    </div>
  );
}
