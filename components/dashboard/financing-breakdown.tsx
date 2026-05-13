import { fmtCZK } from "@/lib/constants";

type Props = { purchasePrice: number; mortgageAmount: number; equityInvested: number };

export function FinancingBreakdown({ purchasePrice, mortgageAmount, equityInvested }: Props) {
  if (purchasePrice <= 0) return null;
  const mortgagePct = Math.min(100, (mortgageAmount / purchasePrice) * 100);
  const equityPct = Math.min(100 - mortgagePct, ((purchasePrice - mortgageAmount) / purchasePrice) * 100);

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8faa8f] mb-1">Financing breakdown</div>
          <div className="font-display text-2xl text-[#2d3b2d]">{fmtCZK(purchasePrice)}</div>
        </div>
        <div className="text-right text-xs text-[#8faa8f]">
          Equity invested: <span className="text-[#2d3b2d] font-medium">{fmtCZK(Math.max(0, equityInvested))}</span>
        </div>
      </div>
      <div className="h-3 bg-[#e8f0e8] rounded-full overflow-hidden flex">
        <div className="bg-[#1c1917] h-full rounded-full" style={{ width: `${mortgagePct}%` }} title="Mortgage" />
        <div className="bg-[#3d5c3d] h-full" style={{ width: `${equityPct}%` }} title="Equity" />
      </div>
      <div className="flex justify-between text-xs text-[#8faa8f] mt-2">
        <span>● Mortgage {fmtCZK(mortgageAmount)}</span>
        <span>● Equity {fmtCZK(purchasePrice - mortgageAmount)}</span>
      </div>
    </div>
  );
}
