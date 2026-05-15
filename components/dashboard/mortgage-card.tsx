import { fmtCZK } from "@/lib/constants";
import { monthlyPayment, paymentSplit, totalsToDate, type MortgageParams } from "@/lib/mortgage";

type Props = { params: MortgageParams };

export function MortgageCard({ params }: Props) {
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
  const paidPct = Number(((totals.principalPaid / params.principal) * 100).toFixed(1));
  const interestPaidPct = Number(((totals.interestPaid / totals.totalProjectedInterest) * 100).toFixed(1));
  const equityPct = Math.round((split.principal / M) * 100);
  const interestPct = 100 - equityPct;
  const yearsLeft = Math.floor((n - monthsElapsed) / 12);
  const moLeft = (n - monthsElapsed) % 12;

  return (
    <div className="bg-white border border-[#E2D9CC] rounded-xl p-4 sm:p-6">
      <div className="flex justify-between items-center mb-5">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#1E3A4A" }}>Mortgage payoff</span>
        <span className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
          {(params.annualRate * 100).toFixed(2)}% · {params.termYears}yr
          {params.mortgageRateFixedUntil ? ` · fixed until ${params.mortgageRateFixedUntil}` : ""}
        </span>
      </div>

      {/* Monthly payment breakdown — text first */}
      <div className="rounded-lg px-4 py-3 mb-5" style={{ background: "rgba(30,58,74,0.06)", border: "1px solid #E2D9CC" }}>
        <div className="text-sm font-medium mb-1" style={{ color: "#1E3A4A" }}>
          <span className="font-display text-lg tabular-nums">{fmtCZK(M)}</span>
          <span style={{ color: "rgba(30,58,74,0.5)" }}> / month</span>
        </div>
        <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
          <span className="tabular-nums font-medium" style={{ color: "#3D8070" }}>{fmtCZK(split.principal)}</span>
          {" "}→ your property
          <span className="mx-2">·</span>
          <span className="tabular-nums font-medium" style={{ color: "#D4684A" }}>{fmtCZK(split.interest)}</span>
          {" "}→ interest
        </div>
      </div>

      {/* Principal progress */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: "#3D8070" }}>Principal paid</span>
          </div>
          <div className="text-right text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
            <span className="tabular-nums font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(totals.principalPaid)}</span>
            {" "}of{" "}
            <span className="tabular-nums">{fmtCZK(params.principal)}</span>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(61,128,112,0.12)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(0.5, paidPct)}%`, background: "#3D8070" }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px]" style={{ color: "rgba(30,58,74,0.5)" }}>
          <span>{paidPct}% yours so far</span>
          <span>{yearsLeft}yr {moLeft}mo left · payoff {totals.payoffDate}</span>
        </div>
      </div>

      {/* Interest progress */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: "#D4684A" }}>Interest paid</span>
          </div>
          <div className="text-right text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
            <span className="tabular-nums font-medium" style={{ color: "#1E3A4A" }}>{fmtCZK(totals.interestPaid)}</span>
            {" "}of{" "}
            <span className="tabular-nums">{fmtCZK(totals.totalProjectedInterest)}</span>
            {" "}projected
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(212,104,74,0.12)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(0.5, interestPaidPct)}%`, background: "#D4684A" }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px]" style={{ color: "rgba(30,58,74,0.5)" }}>
          <span>{interestPaidPct}% of total interest paid</span>
          <span>{equityPct}% of payment → equity · {interestPct}% → bank</span>
        </div>
      </div>

      <div className="text-[10px] text-center mt-3" style={{ color: "rgba(30,58,74,0.32)" }}>
        Calculated automatically · update rate when fixed period resets
      </div>
    </div>
  );
}
