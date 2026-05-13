"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import type { Meta } from "@/db/schema";

export function MetaEditor({ meta, onClose }: { meta: Meta; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    propertyName: meta.propertyName,
    purchasePrice: String(meta.purchasePrice),
    mortgageAmount: String(meta.mortgageAmount),
    targetMonthlyRent: String(meta.targetMonthlyRent),
    sizeM2: String(meta.sizeM2),
    mortgageRate: String(Number(meta.mortgageRate) * 100),
    mortgageTermYears: String(meta.mortgageTermYears),
    mortgageStartDate: meta.mortgageStartDate ?? "",
    mortgageRateFixedUntil: meta.mortgageRateFixedUntil ?? "",
    currentPropertyValue: meta.currentPropertyValue ? String(meta.currentPropertyValue) : "",
  });

  async function save() {
    await fetch("/api/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        mortgageRate: Number(draft.mortgageRate) / 100,
      }),
    });
    router.refresh();
    onClose();
  }

  const field = (label: string, key: keyof typeof draft, type = "text") => (
    <label key={key} className="block text-xs text-[#5f7a5f] uppercase tracking-wider font-semibold">
      {label}
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        className="mt-1 block w-full bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]"
      />
    </label>
  );

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2">{field("Property name", "propertyName")}</div>
        {field("Purchase price (Kč)", "purchasePrice", "number")}
        {field("Mortgage amount (Kč)", "mortgageAmount", "number")}
        {field("Flat size (m²)", "sizeM2", "number")}
        {field("Target monthly rent (Kč)", "targetMonthlyRent", "number")}
        {field("Interest rate (%)", "mortgageRate", "number")}
        {field("Mortgage term (years)", "mortgageTermYears", "number")}
        {field("Mortgage start date", "mortgageStartDate", "date")}
        {field("Fixed rate until", "mortgageRateFixedUntil", "date")}
        <div className="col-span-2">{field("Current property estimate (Kč)", "currentPropertyValue", "number")}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium">
          <Check size={14} /> Save
        </button>
        <button onClick={onClose} className="text-[#8faa8f] hover:text-[#2d3b2d] px-3 py-2 rounded-lg">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
