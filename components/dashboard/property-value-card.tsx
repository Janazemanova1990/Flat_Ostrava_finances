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
    <div className="bg-white border border-[#E2D9CC] rounded-xl p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#1E3A4A" }}>Property value</span>
        {!editing && (
          <button
            onClick={() => { setValue(String(currentValue || "")); setEditing(true); }}
            className="text-xs rounded-lg px-3 py-1 transition-colors"
            style={{ color: "#3D8070", border: "1px solid #E2D9CC" }}
          >
            {hasEstimate ? "Update estimate" : "Add estimate"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Current estimate (Kč)"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "#F5F0E8", border: "1px solid #E2D9CC", color: "#1E3A4A" }}
          />
          <button
            onClick={saveEstimate}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#1E3A4A", color: "#F5F0E8" }}
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ color: "rgba(30,58,74,0.5)" }}
          >
            Cancel
          </button>
        </div>
      ) : hasEstimate ? (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(30,58,74,0.5)" }}>Purchased at</div>
            <div className="font-display text-lg font-medium tabular-nums" style={{ color: "#1E3A4A" }}>{fmtCZK(purchasePrice)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(30,58,74,0.5)" }}>Current estimate</div>
            <div className="font-display text-lg font-medium tabular-nums" style={{ color: "#1E3A4A" }}>{fmtCZK(currentValue)}</div>
            {updatedAt && <div className="text-[10px] mt-0.5" style={{ color: "rgba(30,58,74,0.32)" }}>{updatedAt}</div>}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(30,58,74,0.5)" }}>Gain</div>
            <div className="font-display text-lg font-medium tabular-nums" style={{ color: gainCZK >= 0 ? "#3D8070" : "#D4684A" }}>
              {gainCZK >= 0 ? "+" : ""}{fmtCZK(gainCZK)}
            </div>
            <div className="text-[10px] mt-0.5 tabular-nums" style={{ color: gainPct >= 0 ? "#3D8070" : "#D4684A" }}>
              {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>
          No estimate yet. Add a current market value from Sreality.cz to track appreciation.
        </p>
      )}
    </div>
  );
}
