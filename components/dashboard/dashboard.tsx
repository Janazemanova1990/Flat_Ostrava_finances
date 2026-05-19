"use client";
import { useState, useMemo } from "react";
import { KeyRound, ArrowDownCircle, TrendingUp } from "lucide-react";
import { RateNotification } from "./rate-notification";
import { MortgageCard } from "./mortgage-card";
import { PropertyValueCard } from "./property-value-card";
import { RecentActivity } from "./recent-activity";
import { MonthlyLedger } from "./monthly-ledger";
import { PeriodFilter } from "./period-filter";
import { IncomeExpensesChart } from "./income-expenses-chart";
import { fmtCZK } from "@/lib/constants";
import {
  filterEntriesByPeriod,
  computeTotals,
  daysUntilRateReset,
  type Period,
} from "@/lib/calculations";
import type { Entry, Meta, PropertyValueSnapshot } from "@/db/schema";
import type { MortgageParams } from "@/lib/mortgage";

type Props = { meta: Meta; entries: Entry[]; valueHistory: PropertyValueSnapshot[] };

export function Dashboard({ meta, entries, valueHistory }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all-time");

  const { filtered, monthCount } = useMemo(
    () => filterEntriesByPeriod(entries, selectedPeriod),
    [entries, selectedPeriod]
  );

  const latestPropertyValue = valueHistory.length > 0 ? Number(valueHistory[0].value) : undefined;

  const totals = useMemo(
    () => computeTotals(filtered, entries, meta, monthCount, latestPropertyValue),
    [filtered, entries, meta, monthCount, latestPropertyValue]
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
              className="text-xs uppercase tracking-widest font-bold mb-3"
              style={{ color: "rgba(30,58,74,0.5)" }}
            >
              Property equity
            </div>
            {purchasePrice > 0 ? (
              <>
                <div
                  className="font-sans tabular-nums mb-1"
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
              className="text-xs uppercase tracking-widest font-bold mb-3"
              style={{ color: "rgba(30,58,74,0.5)" }}
            >
              Net monthly cash flow
            </div>
            <div
              className="font-sans tabular-nums mb-1"
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
          {[
            {
              icon: <KeyRound size={12} style={{ color: "rgba(30,58,74,0.5)" }} />,
              label: "Purchase costs",
              value: fmtCZK(totals.purchaseTotal),
              color: "#1E3A4A",
            },
            {
              icon: <TrendingUp size={12} style={{ color: "rgba(30,58,74,0.5)" }} />,
              label: "Property value",
              value: fmtCZK(valueHistory.length > 0 ? Number(valueHistory[0].value) : purchasePrice),
              color: "#1E3A4A",
            },
            {
              icon: <ArrowDownCircle size={12} style={{ color: hasRent ? "#3D8070" : "rgba(30,58,74,0.5)" }} />,
              label: "Net yield",
              value: hasRent && purchasePrice > 0
                ? `${totals.netYield.toFixed(2)} %`
                : "—",
              color: hasRent ? "#1E3A4A" : "rgba(30,58,74,0.32)",
            },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="p-3 sm:p-5 flex flex-col items-center sm:flex-row sm:items-center sm:gap-3">
              <div className="hidden sm:flex p-1.5 bg-white rounded-lg border border-[#E2D9CC] shrink-0">
                {icon}
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <div className="text-[11px] sm:text-xs leading-tight truncate" style={{ color: "rgba(30,58,74,0.5)" }}>
                  {label}
                </div>
                <div
                  className="font-medium tabular-nums text-sm mt-0.5 truncate"
                  style={{ color }}
                >
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <IncomeExpensesChart entries={filtered} />

      <MortgageCard params={mortgageParams} />
      <PropertyValueCard meta={meta} history={valueHistory} />
      <MonthlyLedger entries={entries} meta={meta} />
      <RecentActivity entries={entries} />
    </div>
  );
}
