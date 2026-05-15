"use client";
import { useState, useMemo } from "react";
import { KeyRound, ArrowDownCircle, TrendingUp } from "lucide-react";
import { RateNotification } from "./rate-notification";
import { MortgageCard } from "./mortgage-card";
import { PropertyValueCard } from "./property-value-card";
import { RecentActivity } from "./recent-activity";
import { PeriodFilter } from "./period-filter";
import { fmtCZK } from "@/lib/constants";
import {
  filterEntriesByPeriod,
  computeTotals,
  daysUntilRateReset,
  type Period,
} from "@/lib/calculations";
import type { Entry, Meta } from "@/db/schema";
import type { MortgageParams } from "@/lib/mortgage";

type Props = { meta: Meta; entries: Entry[] };

export function Dashboard({ meta, entries }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all-time");

  const { filtered, monthCount } = useMemo(
    () => filterEntriesByPeriod(entries, selectedPeriod),
    [entries, selectedPeriod]
  );

  const totals = useMemo(
    () => computeTotals(filtered, entries, meta, monthCount),
    [filtered, entries, meta, monthCount]
  );

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
  const hasRent = totals.monthlyIncome > 0;

  return (
    <div className="space-y-6">
      {showRateNotification && (
        <RateNotification
          daysUntil={daysUntilReset!}
          rate={Number(meta.mortgageRate)}
          fixedUntil={meta.mortgageRateFixedUntil!}
          onUpdateRate={() => {}}
        />
      )}

      <PeriodFilter
        selected={selectedPeriod}
        onChange={setSelectedPeriod}
        entries={entries}
      />

      {/* KPI card */}
      <div className="bg-white border border-[#E2D9CC] rounded-xl overflow-hidden">
        {/* Hero tier — 2 KPIs */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x"
          style={{ borderColor: "#E2D9CC" }}
        >
          {/* Property equity */}
          <div className="p-5 sm:p-6">
            <div
              className="text-[10px] uppercase tracking-widest font-bold mb-3"
              style={{ color: "rgba(30,58,74,0.5)" }}
            >
              Property equity
            </div>
            {purchasePrice > 0 ? (
              <>
                <div
                  className="font-display tabular-nums mb-1"
                  style={{ fontSize: "2rem", fontWeight: 600, color: "#3D8070" }}
                >
                  {fmtCZK(totals.propertyEquity)}
                </div>
                <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
                  Your ownership in the property
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: "rgba(30,58,74,0.5)" }}>
                Set property details to see equity
              </p>
            )}
          </div>

          {/* Net monthly cash flow */}
          <div className="p-5 sm:p-6">
            <div
              className="text-[10px] uppercase tracking-widest font-bold mb-3"
              style={{ color: "rgba(30,58,74,0.5)" }}
            >
              Net monthly cash flow
            </div>
            <div
              className="font-display tabular-nums mb-1"
              style={{
                fontSize: "2rem",
                fontWeight: 600,
                color: totals.netMonthly >= 0 ? "#3D8070" : "#D4684A",
              }}
            >
              {fmtCZK(totals.netMonthly)}
            </div>
            <div className="text-xs" style={{ color: "rgba(30,58,74,0.5)" }}>
              Monthly rent - monthly costs
            </div>
          </div>
        </div>

        {/* Support tier — 3 stats */}
        <div
          className="grid grid-cols-3 divide-x border-t"
          style={{ background: "#F5F0E8", borderColor: "#E2D9CC" }}
        >
          <div className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#E2D9CC]">
              <KeyRound size={14} style={{ color: "rgba(30,58,74,0.5)" }} />
            </div>
            <div>
              <div className="text-[10px]" style={{ color: "rgba(30,58,74,0.5)" }}>
                Purchase costs
              </div>
              <div
                className="font-medium tabular-nums text-sm"
                style={{ color: "#1E3A4A" }}
              >
                {fmtCZK(totals.purchaseTotal)}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#E2D9CC]">
              <TrendingUp size={14} style={{ color: "rgba(30,58,74,0.5)" }} />
            </div>
            <div>
              <div className="text-[10px]" style={{ color: "rgba(30,58,74,0.5)" }}>
                Property value
              </div>
              <div
                className="font-medium tabular-nums text-sm"
                style={{ color: "#1E3A4A" }}
              >
                {Number(meta.currentPropertyValue) > 0
                  ? fmtCZK(Number(meta.currentPropertyValue))
                  : "—"}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#E2D9CC]">
              <ArrowDownCircle
                size={14}
                style={{ color: hasRent ? "#3D8070" : "rgba(30,58,74,0.5)" }}
              />
            </div>
            <div>
              <div className="text-[10px]" style={{ color: "rgba(30,58,74,0.5)" }}>
                Net yield
              </div>
              <div
                className="font-medium tabular-nums text-sm"
                style={{ color: hasRent ? "#1E3A4A" : "rgba(30,58,74,0.32)" }}
              >
                {hasRent && purchasePrice > 0
                  ? `${totals.netYield.toFixed(2)} %`
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MortgageCard params={mortgageParams} />
      <PropertyValueCard meta={meta} />
      <RecentActivity entries={entries} />
    </div>
  );
}
