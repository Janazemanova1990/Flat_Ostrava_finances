import { fmtCZK } from "@/lib/constants";
import { monthlyPayment, paymentSplit, totalsToDate, type MortgageParams } from "@/lib/mortgage";

type Props = { params: MortgageParams };

export function MortgageCard({ params }: Props) {
  if (!params.principal || !params.annualRate || !params.startDate) {
    return (
      <div className="bg-white border border-[#d4e0d4] rounded-xl p-6 text-sm text-[#8faa8f]">
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
  const paidPct = ((totals.principalPaid / params.principal) * 100).toFixed(1);
  const interestPaidPct = ((totals.interestPaid / totals.totalProjectedInterest) * 100).toFixed(1);
  const equityPct = Math.round((split.principal / M) * 100);
  const interestPct = 100 - equityPct;
  const yearsLeft = Math.floor((n - monthsElapsed) / 12);
  const moLeft = (n - monthsElapsed) % 12;

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#2d3b2d]">Mortgage payoff</span>
        <span className="text-xs text-[#8faa8f]">
          {(params.annualRate * 100).toFixed(2)}% · {params.termYears}yr
          {params.mortgageRateFixedUntil ? ` · fixed until ${params.mortgageRateFixedUntil}` : ""}
        </span>
      </div>

      <div className="bg-[#f4f7f4] rounded-lg px-4 py-3 flex items-center gap-2 mb-4 flex-wrap">
        <div className="text-center flex-1">
          <div className="text-sm font-bold tabular-nums text-[#2d3b2d]">{fmtCZK(M)}</div>
          <div className="text-[10px] text-[#8faa8f]">monthly payment</div>
        </div>
        <div className="text-[#8faa8f] font-bold">=</div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold tabular-nums text-[#2d6a2d]">{fmtCZK(split.principal)}</div>
          <div className="text-[10px] text-[#8faa8f]">→ your property</div>
        </div>
        <div className="text-[#8faa8f] font-bold">+</div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold tabular-nums text-[#6d28d9]">{fmtCZK(split.interest)}</div>
          <div className="text-[10px] text-[#8faa8f]">→ interest</div>
        </div>
      </div>

      <div className="bg-[#1c1917] rounded-xl p-4 mb-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-[#6b7280] mb-3">Going to your property (principal)</div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="font-display text-xl font-semibold text-[#d1fae5]">{fmtCZK(totals.principalPaid)}</div>
            <div className="text-[10px] text-[#6ee7b7]">equity built to date</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-white">{fmtCZK(totals.remainingBalance)}</div>
            <div className="text-[10px] text-[#6b7280]">remaining balance</div>
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-[#d1fae5] rounded-full" style={{ width: `${Math.max(0.3, Number(paidPct))}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-[#6b7280]">
          <span className="text-[#6ee7b7]">{paidPct}% yours so far</span>
          <span>payoff: {totals.payoffDate}</span>
        </div>
        <div className="flex gap-2 mt-3">
          {[
            { v: fmtCZK(split.principal), l: "principal/month" },
            { v: `${equityPct}%`, l: "payment → equity" },
            { v: `${yearsLeft}yr ${moLeft}mo`, l: "remaining" },
          ].map(({ v, l }) => (
            <div key={l} className="flex-1 bg-white/10 rounded-lg p-2 text-center">
              <div className="text-sm font-semibold text-white tabular-nums">{v}</div>
              <div className="text-[9px] text-[#6b7280] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#f5f3ff] border border-[#ddd6fe] rounded-xl p-4">
        <div className="text-[9px] font-bold uppercase tracking-widest text-[#8b5cf6]/70 mb-3">Interest payments</div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="font-display text-xl font-semibold text-[#6d28d9]">{fmtCZK(totals.interestPaid)}</div>
            <div className="text-[10px] text-[#7c3aed]/70">interest paid to date</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[#4c1d95]">{fmtCZK(totals.totalProjectedInterest)}</div>
            <div className="text-[10px] text-[#8b5cf6]/70">projected total interest</div>
          </div>
        </div>
        <div className="h-2 bg-[#ddd6fe] rounded-full overflow-hidden mb-1">
          <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: `${Math.max(0.3, Number(interestPaidPct))}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-[#8b5cf6]/70">
          <span>{interestPaidPct}% of total interest paid</span>
          <span>over {params.termYears} years</span>
        </div>
        <div className="flex gap-2 mt-3">
          {[
            { v: fmtCZK(split.interest), l: "interest/month" },
            { v: `${interestPct}%`, l: "payment → bank" },
            { v: fmtCZK(totals.totalProjectedInterest), l: "total projected" },
          ].map(({ v, l }) => (
            <div key={l} className="flex-1 bg-white border border-[#ddd6fe] rounded-lg p-2 text-center">
              <div className="text-sm font-semibold text-[#6d28d9] tabular-nums">{v}</div>
              <div className="text-[9px] text-[#8b5cf6]/80 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[9px] text-[#8faa8f] text-center mt-3">
        Calculated automatically · update rate when fixed period resets
      </div>
    </div>
  );
}
