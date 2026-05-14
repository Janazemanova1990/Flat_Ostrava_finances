"use client";
import { useState } from "react";
import { PiggyBank, Wallet, Percent, KeyRound, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { MiniStat } from "./mini-stat";
import { FinancingBreakdown } from "./financing-breakdown";
import { RateNotification } from "./rate-notification";
import { MortgageCard } from "./mortgage-card";
import { PropertyValueCard } from "./property-value-card";
import { RecentActivity } from "./recent-activity";
import { fmtCZK } from "@/lib/constants";
import { daysUntilRateReset, type Totals } from "@/lib/calculations";
import type { Entry, Meta } from "@/db/schema";
import type { MortgageParams } from "@/lib/mortgage";

type Props = { totals: Totals; meta: Meta; entries: Entry[] };

export function Dashboard({ totals, meta, entries }: Props) {
  const [, setShowMetaEditor] = useState(false);

  const daysUntilReset = daysUntilRateReset(meta.mortgageRateFixedUntil ?? null);
  const showRateNotification = daysUntilReset !== null && daysUntilReset <= 60;

  const mortgageParams: MortgageParams = {
    principal: Number(meta.mortgageAmount),
    annualRate: Number(meta.mortgageRate),
    termYears: meta.mortgageTermYears,
    startDate: meta.mortgageStartDate ?? "",
    mortgageRateFixedUntil: meta.mortgageRateFixedUntil ?? undefined,
  };

  const purchasePrice = Number(meta.purchasePrice);

  return (
    <div className="space-y-6">
      {showRateNotification && (
        <RateNotification
          daysUntil={daysUntilReset!}
          rate={Number(meta.mortgageRate)}
          fixedUntil={meta.mortgageRateFixedUntil!}
          onUpdateRate={() => setShowMetaEditor(true)}
        />
      )}

      <div className="bg-white border border-[#d4e0d4] rounded-xl overflow-hidden">
        {/* KPI section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#d4e0d4]">
          {purchasePrice > 0 ? (
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs uppercase tracking-widest text-[#8faa8f]">Property equity</div>
                <PiggyBank size={15} className="text-[#8faa8f]" />
              </div>
              <div className="font-display text-3xl font-medium tabular-nums text-[#2d3b2d]">{fmtCZK(totals.propertyEquity)}</div>
              <div className="text-xs text-[#8faa8f] mt-2">Your ownership in the property (price - mortgage)</div>
            </div>
          ) : (
            <div className="p-5 sm:p-6 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-widest text-[#8faa8f] mb-2">Property equity</div>
              <p className="text-sm text-[#8faa8f]">Set property details to see equity</p>
            </div>
          )}
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs uppercase tracking-widest text-[#8faa8f]">Net monthly cash flow</div>
              <Wallet size={15} className="text-[#8faa8f]" />
            </div>
            <div className="font-display text-3xl font-medium tabular-nums" style={{ color: totals.netMonthly >= 0 ? "#2d6a2d" : "#8b4a4a" }}>{fmtCZK(totals.netMonthly)}</div>
            <div className="text-xs text-[#8faa8f] mt-2">Monthly rent - monthly costs</div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs uppercase tracking-widest text-[#8faa8f]">Net yield</div>
              <Percent size={15} className="text-[#8faa8f]" />
            </div>
            <div className="font-display text-3xl font-medium tabular-nums text-[#2d3b2d]">{totals.netYield.toFixed(2)} %</div>
            <div className="text-xs text-[#8faa8f] mt-2">Gross {totals.grossYield.toFixed(2)} % · annual return on purchase price</div>
          </div>
        </div>

        {/* Totals section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#d4e0d4] border-t border-[#d4e0d4] bg-[#f4f7f4]">
          <div className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#d4e0d4]">
              <KeyRound size={14} className="text-[#8faa8f]" />
            </div>
            <div>
              <div className="text-xs text-[#8faa8f]">Purchase costs</div>
              <div className="font-medium tabular-nums text-sm text-[#2d3b2d]">{fmtCZK(totals.purchaseTotal)}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#d4e0d4]">
              <ArrowUpCircle size={14} className="text-[#8faa8f]" />
            </div>
            <div>
              <div className="text-xs text-[#8faa8f]">Expenses to date</div>
              <div className="font-medium tabular-nums text-sm text-[#2d3b2d]">{fmtCZK(totals.ongoingTotal)}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#d4e0d4]">
              <ArrowDownCircle size={14} className="text-[#2d6a2d]" />
            </div>
            <div>
              <div className="text-xs text-[#8faa8f]">Income received</div>
              <div className="font-medium tabular-nums text-sm text-[#2d6a2d]">{fmtCZK(totals.incomeTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      <FinancingBreakdown
        purchasePrice={purchasePrice}
        mortgageAmount={Number(meta.mortgageAmount)}
      />

      <MortgageCard params={mortgageParams} />
      <PropertyValueCard meta={meta} />
      <RecentActivity entries={entries} />
    </div>
  );
}
