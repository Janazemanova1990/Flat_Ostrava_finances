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
    <label key={key} className="block text-xs uppercase tracking-wider font-semibold" style={{ color: "rgba(30,58,74,0.6)" }}>
      {label}
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        className="mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: "#F5F0E8", border: "1px solid #E2D9CC", color: "#1E3A4A" }}
      />
    </label>
  );

  return (
    <div className="bg-white rounded-xl p-5 max-w-2xl" style={{ border: "1px solid #E2D9CC" }}>
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
      </div>
      <div className="flex gap-2">
        <button
          onClick={save}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#1E3A4A", color: "#F5F0E8" }}
        >
          <Check size={14} /> Save
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg"
          style={{ color: "rgba(30,58,74,0.5)" }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
