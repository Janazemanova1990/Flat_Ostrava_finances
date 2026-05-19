"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import { fmtCZK, fmtDate } from "@/lib/constants";
import type { Meta, PropertyValueSnapshot } from "@/db/schema";

type Props = { meta: Meta; history: PropertyValueSnapshot[] };

export function PropertyValueCard({ meta, history }: Props) {
  const [editing, setEditing] = useState(false);
  const [pricePerM2, setPricePerM2] = useState("");
  const router = useRouter();

  const purchasePrice = Number(meta.purchasePrice);
  const currentValue = Number(meta.currentPropertyValue ?? 0);
  const sizeM2 = Number(meta.sizeM2) || 59;
  const hasEstimate = currentValue > 0;
  const gainCZK = currentValue - purchasePrice;
  const gainPct = purchasePrice > 0 ? (gainCZK / purchasePrice) * 100 : 0;
  const color = gainCZK >= 0 ? "#3D8070" : "#D4684A";

  const parsedPpm2 = Number(pricePerM2.replace(/\s/g, ""));
  const calculatedTotal = parsedPpm2 > 0 ? Math.round(parsedPpm2 * sizeM2) : 0;

  function openEdit() {
    const ppm2 = currentValue > 0 ? Math.round(currentValue / sizeM2) : 0;
    setPricePerM2(ppm2 > 0 ? String(ppm2) : "");
    setEditing(true);
  }

  async function saveEstimate() {
    if (!calculatedTotal) return;
    await fetch("/api/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPropertyValue: calculatedTotal }),
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
            onClick={openEdit}
            className="text-xs rounded-lg px-3 py-1 transition-colors"
            style={{ color: "#3D8070", border: "1px solid #E2D9CC" }}
          >
            {hasEstimate ? "Update estimate" : "Add estimate"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "rgba(30,58,74,0.5)" }}>
              Price per m² (Kč)
            </label>
            <input
              type="number"
              value={pricePerM2}
              onChange={(e) => setPricePerM2(e.target.value)}
              placeholder="e.g. 70 000"
              autoFocus
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "#F5F0E8", border: "1px solid #E2D9CC", color: "#1E3A4A" }}
            />
          </div>
          {calculatedTotal > 0 && (
            <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
              {parsedPpm2.toLocaleString("cs-CZ")} Kč × {sizeM2} m² ={" "}
              <span className="font-semibold tabular-nums" style={{ color: "#1E3A4A" }}>{fmtCZK(calculatedTotal)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={saveEstimate}
              disabled={!calculatedTotal}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
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
        </div>
      ) : hasEstimate ? (
        <div className="space-y-3">
          {/* Gain hero */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {gainCZK >= 0 ? <ArrowUp size={18} style={{ color }} /> : <ArrowDown size={18} style={{ color }} />}
              <span className="font-display text-2xl font-medium tabular-nums" style={{ color }}>
                {gainCZK >= 0 ? "+" : ""}{fmtCZK(gainCZK)}
              </span>
            </div>
            <span className="font-display text-2xl font-medium tabular-nums" style={{ color }}>
              {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
            </span>
          </div>

          <div style={{ borderTop: "1px solid #E2D9CC" }} />

          {/* History rows — newest first */}
          {history.map((snap) => (
            <div key={snap.id} className="flex items-center justify-between gap-2 text-sm tabular-nums">
              <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(snap.recordedAt)}</span>
              {snap.pricePerM2 && (
                <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtCZK(Number(snap.pricePerM2))}/m²</span>
              )}
              <span className="font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(Number(snap.value))}</span>
            </div>
          ))}

          <div style={{ borderTop: "1px solid #E2D9CC" }} />

          {/* Purchase row */}
          <div className="flex items-center justify-between gap-2 text-sm tabular-nums">
            <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(meta.mortgageStartDate)}</span>
            {sizeM2 > 0 && (
              <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtCZK(Math.round(purchasePrice / sizeM2))}/m²</span>
            )}
            <span className="font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(purchasePrice)}</span>
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
