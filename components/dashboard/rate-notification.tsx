"use client";
import { Bell } from "lucide-react";
import { useState } from "react";

type Props = { daysUntil: number; rate: number; fixedUntil: string; onUpdateRate: () => void };

export function RateNotification({ daysUntil, rate, fixedUntil, onUpdateRate }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const month = new Date(fixedUntil).toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-3 bg-[#fffbeb] border border-[#fcd34d] rounded-xl p-4">
      <Bell size={18} className="text-[#92400e] flex-shrink-0" />
      <p className="text-sm text-[#92400e] flex-1">
        Your fixed rate <strong>{(rate * 100).toFixed(2)}%</strong> expires in{" "}
        <strong>{daysUntil} days</strong> ({month}). Contact your bank to renegotiate, then update your rate here.
      </p>
      <button onClick={onUpdateRate}
        className="bg-[#f59e0b] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
        Update rate
      </button>
      <button onClick={() => setDismissed(true)} className="text-[#92400e] text-xs opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}
