"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import { fmtCZK, fmtDate } from "@/lib/constants";
import { monthlyPayment, paymentSplit, totalsToDate, type MortgageParams } from "@/lib/mortgage";

type Props = { params: MortgageParams };

export function MortgageCard({ params }: Props) {
  const [tip, setTip] = useState(false);

  if (!params.principal || !params.annualRate || !params.startDate) {
    return (
      <div className="bg-white border border-[#E2D9CC] rounded-xl p-4 sm:p-6 text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>
        Add mortgage details in property settings to see payoff progress.
      </div>
    );
  }

  const M = monthlyPayment(params);
  const now = new Date();
  const start = new Date(params.startDate);
  const monthsElapsed = Math.max(1,
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  );
  const split = paymentSplit(params, monthsElapsed);
  const totals = totalsToDate(params);
  const n = params.termYears * 12;
  const remaining = params.principal - totals.principalPaid;
  const paidPct = Number(((totals.principalPaid / params.principal) * 100).toFixed(1));
  const interestPaidPct = Number(((totals.interestPaid / totals.totalProjectedInterest) * 100).toFixed(1));
  const yearsLeft = Math.floor((n - monthsElapsed) / 12);
  const moLeft = (n - monthsElapsed) % 12;

  return (
    <div className="bg-white border border-[#E2D9CC] rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-5 sm:px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(30,58,74,0.08)" }}>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#1E3A4A" }}>Mortgage payoff</span>
        <div className="relative">
          <button
            onClick={() => setTip((v) => !v)}
            className="flex items-center justify-center rounded-full"
            style={{ width: 16, height: 16, border: "1px solid #E2D9CC", color: "rgba(30,58,74,0.5)" }}
            aria-label="Mortgage details"
          >
            <Info size={9} />
          </button>
          {tip && (
            <div
              className="absolute left-0 top-6 z-10 rounded-lg p-3 text-xs whitespace-nowrap"
              style={{ background: "white", border: "1px solid #E2D9CC", color: "#1E3A4A", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            >
              <div className="space-y-1" style={{ color: "rgba(30,58,74,0.7)" }}>
                <div>Interest rate <span className="font-semibold" style={{ color: "#1E3A4A" }}>{(params.annualRate * 100).toFixed(2)}%</span></div>
                {params.mortgageRateFixedUntil && (
                  <div>Fixed until <span className="font-semibold" style={{ color: "#1E3A4A" }}>{fmtDate(params.mortgageRateFixedUntil)}</span></div>
                )}
                <div>{params.termYears} years · payoff <span className="font-semibold" style={{ color: "#1E3A4A" }}>{totals.payoffDate}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly payment row */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid rgba(30,58,74,0.08)" }}>
        <span className="font-display tabular-nums" style={{ fontSize: "1.75rem", fontWeight: 500, color: "#1E3A4A" }}>
          {fmtCZK(M)}
        </span>
        <span className="text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>/ month</span>
        <span className="ml-auto text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
          <span className="tabular-nums font-semibold" style={{ color: "#3D8070" }}>{fmtCZK(split.principal)}</span>
          {" "}→ your property
          <span className="mx-1.5">·</span>
          <span className="tabular-nums font-semibold" style={{ color: "#D4684A" }}>{fmtCZK(split.interest)}</span>
          {" "}→ interest
        </span>
      </div>

      {/* Progress sections */}
      <div className="px-5 sm:px-6 py-5 flex flex-col gap-5">
        {/* Principal */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: "#1E3A4A" }}>Principal paid</span>
            <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
              <span className="tabular-nums font-semibold" style={{ color: "#3D8070" }}>{fmtCZK(totals.principalPaid)}</span>
              {" "}of {fmtCZK(remaining)}
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(61,128,112,0.12)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(0.5, paidPct)}%`, background: "#3D8070" }} />
          </div>
          <p className="mt-1.5 text-[10px]" style={{ color: "rgba(30,58,74,0.5)" }}>
            {paidPct}% paid
          </p>
        </div>

        {/* Interest */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: "#1E3A4A" }}>Interest paid</span>
            <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
              <span className="tabular-nums font-semibold" style={{ color: "#D4684A" }}>{fmtCZK(totals.interestPaid)}</span>
              {" "}of {fmtCZK(totals.totalProjectedInterest)}
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(212,104,74,0.12)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(0.5, interestPaidPct)}%`, background: "#D4684A" }} />
          </div>
          <p className="mt-1.5 text-[10px]" style={{ color: "rgba(30,58,74,0.5)" }}>
            {interestPaidPct}% paid
          </p>
        </div>
      </div>
    </div>
  );
}
