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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {purchasePrice > 0 ? (
          <KpiCard label="Property equity" value={fmtCZK(totals.propertyEquity)}
            sublabel="Your ownership in the property (price − mortgage)" icon={PiggyBank} />
        ) : (
          <div className="bg-white border border-[#d4e0d4] rounded-xl p-4 sm:p-6 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-widest text-[#8faa8f] mb-2">Property equity</div>
            <p className="text-sm text-[#8faa8f]">Set property details to see equity</p>
          </div>
        )}
        <KpiCard label="Net monthly cash flow" value={fmtCZK(totals.netMonthly)}
          sublabel={`${fmtCZK(totals.monthlyIncome)} rent − ${fmtCZK(totals.monthlyOngoing)} costs`}
          icon={Wallet} valueColor={totals.netMonthly >= 0 ? "#2d6a2d" : "#8b4a4a"} />
        <KpiCard label="Net yield" value={`${totals.netYield.toFixed(2)} %`}
          sublabel={`Gross ${totals.grossYield.toFixed(2)} % · annual return on purchase price`} icon={Percent} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStat label="Purchase costs" value={fmtCZK(totals.purchaseTotal)} icon={KeyRound} />
        <MiniStat label="Expenses to date" value={fmtCZK(totals.ongoingTotal)} icon={ArrowUpCircle} />
        <MiniStat label="Income received" value={fmtCZK(totals.incomeTotal)} icon={ArrowDownCircle} valueColor="#2d6a2d" />
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
