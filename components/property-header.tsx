"use client";
import { useState } from "react";
import { Home, Pencil } from "lucide-react";
import { MetaEditor } from "@/components/meta-editor";
import { fmtCZK } from "@/lib/constants";
import type { Meta } from "@/db/schema";

export function PropertyHeader({ meta }: { meta: Meta }) {
  const [editing, setEditing] = useState(false);
  const purchasePrice = Number(meta.purchasePrice);
  const sizeM2 = Number(meta.sizeM2);
  const mortgageAmount = Number(meta.mortgageAmount);
  const downPayment = purchasePrice - mortgageAmount;
  const downPct = purchasePrice > 0 ? Math.round((downPayment / purchasePrice) * 100) : 0;
  const pricePerM2 = sizeM2 > 0 ? Math.round(purchasePrice / sizeM2) : 0;

  return (
    <header className="mb-8">
      <div className="flex items-center gap-2 text-[#8faa8f] text-xs tracking-widest uppercase mb-5">
        <Home size={12} />
        <span>Property Finance</span>
      </div>

      {editing ? (
        <MetaEditor meta={meta} onClose={() => setEditing(false)} />
      ) : (
        <>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight break-words text-[#2d3b2d] mb-3">
            {meta.propertyName}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {sizeM2 > 0 && (
              <span className="inline-flex items-center bg-[#e8f0e8] text-[#3d5c3d] text-xs font-medium px-3 py-1.5 rounded-full border border-[#b8d4b8]">
                {sizeM2} m²
              </span>
            )}
            {purchasePrice > 0 && (
              <span className="inline-flex items-center bg-[#f4f7f4] text-[#5f7a5f] text-xs font-medium px-3 py-1.5 rounded-full border border-[#d4e0d4]">
                {fmtCZK(purchasePrice)}
              </span>
            )}
            {pricePerM2 > 0 && (
              <span className="inline-flex items-center bg-[#ede9fe] text-[#5b21b6] text-xs font-medium px-3 py-1.5 rounded-full border border-[#c4b5fd]">
                {fmtCZK(pricePerM2)} / m²
              </span>
            )}
<button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-[#8faa8f] text-xs hover:text-[#2d3b2d] border border-[#d4e0d4] rounded-full px-3 py-1.5 hover:border-[#8faa8f] transition-colors"
            >
              <Pencil size={10} /> edit
            </button>
          </div>
        </>
      )}
    </header>
  );
}
