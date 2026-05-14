"use client";
import { useState } from "react";
import { Home, Pencil, Download } from "lucide-react";
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
    <header className="mb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[#8faa8f] text-xs tracking-widest uppercase mb-2">
            <Home size={12} />
            <span>Property Finance</span>
          </div>
          {editing ? (
            <MetaEditor meta={meta} onClose={() => setEditing(false)} />
          ) : (
            <div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight break-words text-[#2d3b2d]">
                {meta.propertyName}
              </h1>
              <div className="flex gap-2 flex-wrap mt-3">
                {sizeM2 > 0 && (
                  <span className="bg-[#e8f0e8] text-[#3d5c3d] text-xs font-medium px-3 py-1 rounded-full">
                    {sizeM2} m²
                  </span>
                )}
                {purchasePrice > 0 && (
                  <span className="bg-[#f4f7f4] text-[#5f7a5f] text-xs font-medium px-3 py-1 rounded-full border border-[#d4e0d4]">
                    {fmtCZK(purchasePrice)}
                  </span>
                )}
                {pricePerM2 > 0 && (
                  <span className="bg-[#ede9fe] text-[#5b21b6] text-xs font-medium px-3 py-1 rounded-full">
                    {fmtCZK(pricePerM2)} / m²
                  </span>
                )}
                {downPayment > 0 && (
                  <span className="bg-[#1c1917] text-[#fafaf9] text-xs font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap">
                    {downPct}% down · {fmtCZK(downPayment)} equity
                  </span>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="text-[#8faa8f] text-xs hover:text-[#2d3b2d] flex items-center gap-1 px-2"
                >
                  <Pencil size={11} /> edit
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-start">
          <a href="/api/export?format=json" className="flex items-center gap-1.5 bg-white border border-[#d4e0d4] text-[#5f7a5f] text-xs font-medium px-3 py-1.5 rounded-lg hover:border-[#3d5c3d]">
            <Download size={12} /> Backup JSON
          </a>
          <a href="/api/export?format=csv" className="flex items-center gap-1.5 bg-white border border-[#d4e0d4] text-[#5f7a5f] text-xs font-medium px-3 py-1.5 rounded-lg hover:border-[#3d5c3d]">
            <Download size={12} /> CSV
          </a>
        </div>
      </div>
    </header>
  );
}
