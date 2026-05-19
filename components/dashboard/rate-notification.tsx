"use client";
import { Bell } from "lucide-react";
import { useState } from "react";
import { fmtDate } from "@/lib/constants";

type Props = { daysUntil: number; rate: number; fixedUntil: string; onUpdateRate: () => void };

export function RateNotification({ daysUntil, rate, fixedUntil, onUpdateRate }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const month = fmtDate(fixedUntil);

  return (
    <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "#FFF8F5", border: "1px solid rgba(212,104,74,0.3)" }}>
      <Bell size={18} className="flex-shrink-0" style={{ color: "#D4684A" }} />
      <p className="text-sm flex-1" style={{ color: "#1E3A4A" }}>
        Your fixed rate <strong>{(rate * 100).toFixed(2)}%</strong> expires in{" "}
        <strong>{daysUntil} days</strong> ({month}). Contact your bank to renegotiate, then update your rate here.
      </p>
      <button
        onClick={onUpdateRate}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap"
        style={{ background: "#D4684A", color: "#FFFFFF" }}
      >
        Update rate
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs opacity-60 hover:opacity-100"
        style={{ color: "#D4684A" }}
      >
        ✕
      </button>
    </div>
  );
}
