"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { fmtCZK, fmtDate } from "@/lib/constants";
import type { Meta, PropertyValueSnapshot } from "@/db/schema";

type Props = { meta: Meta; history: PropertyValueSnapshot[] };

function HistoryRow({
  snap, sizeM2, onRefresh,
}: { snap: PropertyValueSnapshot; sizeM2: number; onRefresh: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [ppm2, setPpm2] = useState(snap.pricePerM2 ? String(Math.round(Number(snap.pricePerM2))) : "");

  const parsed = Number(ppm2.replace(/\s/g, ""));
  const preview = parsed > 0 ? Math.round(parsed * sizeM2) : 0;

  async function save() {
    if (!preview) return;
    await fetch(`/api/property-value-history/${snap.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricePerM2: parsed, sizeM2 }),
    });
    setEditMode(false);
    onRefresh();
  }

  async function remove() {
    if (!confirm("Delete this estimate?")) return;
    await fetch(`/api/property-value-history/${snap.id}`, { method: "DELETE" });
    onRefresh();
  }

  if (editMode) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-sm tabular-nums" style={{ color: "rgba(30,58,74,0.45)", minWidth: 80 }}>{fmtDate(snap.recordedAt)}</span>
        <input
          type="number"
          value={ppm2}
          onChange={(e) => setPpm2(e.target.value)}
          placeholder="Kč/m²"
          className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
          style={{ background: "#F5F0E8", border: "1px solid #E2D9CC", color: "#1E3A4A" }}
          autoFocus
        />
        {preview > 0 && (
          <span className="text-xs tabular-nums" style={{ color: "rgba(30,58,74,0.5)" }}>{fmtCZK(preview)}</span>
        )}
        <button onClick={save} disabled={!preview} className="text-xs font-medium px-3 py-1 rounded-lg disabled:opacity-40" style={{ background: "#1E3A4A", color: "#F5F0E8" }}>Save</button>
        <button onClick={() => setEditMode(false)} className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm tabular-nums group">
      <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(snap.recordedAt)}</span>
      {snap.pricePerM2 && (
        <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtCZK(Number(snap.pricePerM2))}/m²</span>
      )}
      <span className="font-medium ml-auto" style={{ color: "#1E3A4A" }}>{fmtCZK(Number(snap.value))}</span>
      <button onClick={() => setEditMode(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded" style={{ color: "rgba(30,58,74,0.4)" }}>
        <Pencil size={12} />
      </button>
      <button onClick={remove} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded" style={{ color: "#D4684A" }}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export function PropertyValueCard({ meta, history }: Props) {
  const [editing, setEditing] = useState(false);
  const [pricePerM2, setPricePerM2] = useState("");
  const router = useRouter();

  const purchasePrice = Number(meta.purchasePrice);
  const sizeM2 = Number(meta.sizeM2) || 59;
  const hasEstimate = history.length > 0;
  const latestValue = hasEstimate ? Number(history[0].value) : 0;
  const gainCZK = hasEstimate ? latestValue - purchasePrice : 0;
  const gainPct = hasEstimate && purchasePrice > 0 ? (gainCZK / purchasePrice) * 100 : 0;
  const color = gainCZK >= 0 ? "#3D8070" : "#D4684A";

  const parsedPpm2 = Number(pricePerM2.replace(/\s/g, ""));
  const calculatedTotal = parsedPpm2 > 0 ? Math.round(parsedPpm2 * sizeM2) : 0;

  function openEdit() {
    const ppm2 = latestValue > 0 ? Math.round(latestValue / sizeM2) : 0;
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
          <button onClick={openEdit} className="text-xs rounded-lg px-3 py-1 transition-colors" style={{ color: "#3D8070", border: "1px solid #E2D9CC" }}>
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
            <button onClick={saveEstimate} disabled={!calculatedTotal} className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40" style={{ background: "#1E3A4A", color: "#F5F0E8" }}>Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>Cancel</button>
          </div>
        </div>
      ) : hasEstimate ? (
        <div className="space-y-3">
          {/* Gain hero — % first (smaller), then amount */}
          <div className="flex items-center gap-3">
            {gainCZK >= 0 ? <ArrowUp size={18} style={{ color }} /> : <ArrowDown size={18} style={{ color }} />}
            <span className="font-display text-lg font-medium tabular-nums" style={{ color }}>
              {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
            </span>
            <span className="font-display text-2xl font-medium tabular-nums" style={{ color }}>
              {gainCZK >= 0 ? "+" : ""}{fmtCZK(gainCZK)}
            </span>
          </div>

          <div style={{ borderTop: "1px solid #E2D9CC" }} />

          {/* History rows — newest first, with edit/delete on hover */}
          <div className="space-y-2">
            {history.map((snap) => (
              <HistoryRow key={snap.id} snap={snap} sizeM2={sizeM2} onRefresh={() => router.refresh()} />
            ))}
          </div>

          <div style={{ borderTop: "1px solid #E2D9CC" }} />

          {/* Purchase row — static */}
          <div className="flex items-center gap-2 text-sm tabular-nums">
            <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(meta.mortgageStartDate)}</span>
            {sizeM2 > 0 && <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtCZK(Math.round(purchasePrice / sizeM2))}/m²</span>}
            <span className="font-medium ml-auto" style={{ color: "#1E3A4A" }}>{fmtCZK(purchasePrice)}</span>
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
