"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { fmtCZK, fmtDate } from "@/lib/constants";
import type { Meta, PropertyValueSnapshot } from "@/db/schema";

type Props = { meta: Meta; history: PropertyValueSnapshot[] };

const COL4 = "1fr 1fr 1fr auto";

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-0.5 pl-2">
      <button onClick={onEdit} className="p-1 rounded" style={{ color: "rgba(30,58,74,0.4)" }}>
        <Pencil size={12} />
      </button>
      <button onClick={onDelete} className="p-1 rounded" style={{ color: "#D4684A" }}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}

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
    <div>
      {/* Mobile: 2-line */}
      <div className="sm:hidden text-sm tabular-nums">
        <div style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(snap.recordedAt)}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span style={{ color: "rgba(30,58,74,0.6)" }}>
            {snap.pricePerM2 ? `${fmtCZK(Number(snap.pricePerM2))}/m²` : ""}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(Number(snap.value))}</span>
            <ActionButtons onEdit={() => setEditMode(true)} onDelete={remove} />
          </div>
        </div>
      </div>
      {/* Desktop: 4-col grid */}
      <div className="hidden sm:grid items-center text-sm tabular-nums" style={{ gridTemplateColumns: COL4 }}>
        <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(snap.recordedAt)}</span>
        <span className="text-center" style={{ color: "#1E3A4A" }}>
          {snap.pricePerM2 ? `${fmtCZK(Number(snap.pricePerM2))}/m²` : ""}
        </span>
        <span className="text-right font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(Number(snap.value))}</span>
        <ActionButtons onEdit={() => setEditMode(true)} onDelete={remove} />
      </div>
    </div>
  );
}

function PurchaseRow({
  meta, sizeM2, onRefresh,
}: { meta: Meta; sizeM2: number; onRefresh: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const purchasePrice = Number(meta.purchasePrice);
  const [price, setPrice] = useState(String(purchasePrice));

  const parsed = Number(price.replace(/\s/g, ""));

  async function save() {
    if (!parsed) return;
    await fetch("/api/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchasePrice: parsed }),
    });
    setEditMode(false);
    onRefresh();
  }

  async function remove() {
    if (!confirm("Clear purchase price?")) return;
    await fetch("/api/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchasePrice: 0 }),
    });
    onRefresh();
  }

  if (editMode) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-sm tabular-nums" style={{ color: "rgba(30,58,74,0.45)", minWidth: 80 }}>{fmtDate(meta.mortgageStartDate)}</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Purchase price"
          className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
          style={{ background: "#F5F0E8", border: "1px solid #E2D9CC", color: "#1E3A4A" }}
          autoFocus
        />
        <button onClick={save} disabled={!parsed} className="text-xs font-medium px-3 py-1 rounded-lg disabled:opacity-40" style={{ background: "#1E3A4A", color: "#F5F0E8" }}>Save</button>
        <button onClick={() => setEditMode(false)} className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>Cancel</button>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: 2-line */}
      <div className="sm:hidden text-sm tabular-nums">
        <div style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(meta.mortgageStartDate)}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span style={{ color: "rgba(30,58,74,0.6)" }}>
            {sizeM2 > 0 ? `${fmtCZK(Math.round(purchasePrice / sizeM2))}/m²` : ""}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(purchasePrice)}</span>
            <ActionButtons onEdit={() => setEditMode(true)} onDelete={remove} />
          </div>
        </div>
      </div>
      {/* Desktop: 4-col grid */}
      <div className="hidden sm:grid items-center text-sm tabular-nums" style={{ gridTemplateColumns: COL4 }}>
        <span style={{ color: "rgba(30,58,74,0.45)" }}>{fmtDate(meta.mortgageStartDate)}</span>
        <span className="text-center" style={{ color: "#1E3A4A" }}>
          {sizeM2 > 0 ? `${fmtCZK(Math.round(purchasePrice / sizeM2))}/m²` : ""}
        </span>
        <span className="text-right font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(purchasePrice)}</span>
        <ActionButtons onEdit={() => setEditMode(true)} onDelete={remove} />
      </div>
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
    await fetch("/api/property-value-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: calculatedTotal, pricePerM2: parsedPpm2 > 0 ? parsedPpm2 : null }),
    });
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-[#E2D9CC] rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(30,58,74,0.08)" }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#1E3A4A" }}>Property value</span>
        {!editing && (
          <button onClick={openEdit} className="text-xs rounded-lg px-3 py-1 transition-colors" style={{ color: "#3D8070", border: "1px solid #E2D9CC" }}>
            {hasEstimate ? "Update estimate" : "Add estimate"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="px-5 sm:px-6 py-5 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "rgba(30,58,74,0.5)" }}>
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
      ) : (
        <div className="px-5 sm:px-6 py-5 space-y-3">
          {/* Gain hero — aligned to same 4-col grid */}
          {hasEstimate && (
            <>
              {/* Mobile gain hero */}
              <div className="flex items-center justify-between tabular-nums sm:hidden">
                <div className="flex items-center gap-1.5">
                  {gainCZK >= 0 ? <ArrowUp size={16} style={{ color }} /> : <ArrowDown size={16} style={{ color }} />}
                  <span className="font-sans text-lg font-semibold" style={{ color }}>
                    {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                  </span>
                </div>
                <span className="font-sans text-xl font-semibold" style={{ color }}>
                  {gainCZK >= 0 ? "+" : ""}{fmtCZK(gainCZK)}
                </span>
              </div>
              {/* Desktop gain hero */}
              <div className="hidden sm:grid items-center tabular-nums" style={{ gridTemplateColumns: COL4 }}>
                <div className="flex items-center">
                  {gainCZK >= 0 ? <ArrowUp size={16} style={{ color }} /> : <ArrowDown size={16} style={{ color }} />}
                </div>
                <span className="text-center font-sans text-lg font-semibold" style={{ color }}>
                  {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                </span>
                <span className="text-right font-sans text-xl font-semibold" style={{ color }}>
                  {gainCZK >= 0 ? "+" : ""}{fmtCZK(gainCZK)}
                </span>
                <div />
              </div>
              <div style={{ borderTop: "1px solid #E2D9CC" }} />
            </>
          )}

          {/* History rows */}
          {hasEstimate && (
            <div className="space-y-2">
              {history.map((snap) => (
                <HistoryRow key={snap.id} snap={snap} sizeM2={sizeM2} onRefresh={() => router.refresh()} />
              ))}
              <div style={{ borderTop: "1px solid #E2D9CC" }} />
            </div>
          )}

          {/* Purchase row */}
          <PurchaseRow meta={meta} sizeM2={sizeM2} onRefresh={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}
