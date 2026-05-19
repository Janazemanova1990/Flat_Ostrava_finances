"use client";
import { useMemo } from "react";
import { paymentSplit, type MortgageParams } from "@/lib/mortgage";
import { colours } from "@/lib/colours";
import type { Entry, Meta } from "@/db/schema";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtNum = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

function fmt(n: number): string {
  return fmtNum.format(n);
}

type Props = { entries: Entry[]; meta: Meta };

export function MonthlyLedger({ entries, meta }: Props) {
  const rows = useMemo(() => {
    const now = new Date();
    const activeEntries = entries.filter(e => e.section === "ongoing" || e.section === "income");
    const earliestDate = activeEntries.length > 0
      ? activeEntries.reduce((min, e) => e.date < min ? e.date : min, activeEntries[0].date)
      : null;
    const start = earliestDate ? new Date(earliestDate) : null;
    const monthsElapsed = start
      ? (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
      : 1;
    const rowCount = Math.min(Math.max(1, monthsElapsed), 6);

    const months: { year: number; month: number }[] = [];
    for (let i = 0; i < rowCount; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const hasMortgage =
      Number(meta.mortgageAmount) > 0 &&
      Number(meta.mortgageRate) > 0 &&
      !!meta.mortgageStartDate;

    const params: MortgageParams | null = hasMortgage
      ? {
          principal: Number(meta.mortgageAmount),
          annualRate: Number(meta.mortgageRate),
          termYears: meta.mortgageTermYears,
          startDate: meta.mortgageStartDate!,
        }
      : null;

    return months.map(({ year, month }) => {
      const yyyyMM = `${year}-${String(month + 1).padStart(2, "0")}`;
      const label = `${MONTHS[month]} '${String(year).slice(2)}`;

      const income = entries
        .filter((e) => e.section === "income" && e.date.startsWith(yyyyMM))
        .reduce((s, e) => s + Number(e.amount), 0);

      const expenses = entries
        .filter((e) => e.section === "ongoing" && e.date.startsWith(yyyyMM))
        .reduce((s, e) => s + Number(e.amount), 0);

      const net = income - expenses;

      let principal = 0;
      let interest = 0;
      let balance = 0;

      if (params) {
        const start = new Date(params.startDate);
        const monthNumber =
          (year - start.getFullYear()) * 12 + (month - start.getMonth()) + 1;
        if (monthNumber >= 1) {
          const split = paymentSplit(params, monthNumber);
          principal = split.principal;
          interest = split.interest;
          balance = split.remainingBalance;
        }
      }

      return { yyyyMM, label, income, expenses, net, principal, interest, balance };
    });
  }, [entries, meta]);

  const purchaseFooter = useMemo(() => {
    const active = entries.filter(e => e.section === "ongoing" || e.section === "income");
    if (active.length === 0) return null;
    const earliest = active.reduce((min, e) => e.date < min ? e.date : min, active[0].date);
    const [y, m] = earliest.split("-").map(Number);
    return `${MONTHS[m - 1]} '${String(y).slice(2)} — first payment month`;
  }, [entries]);

  const hasMortgage = Number(meta.mortgageAmount) > 0 && !!meta.mortgageStartDate;

  const colHeader: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: colours.navyMid,
    padding: "0.5rem 0.75rem",
    textAlign: "right",
    whiteSpace: "nowrap",
  };
  const colHeaderLeft: React.CSSProperties = { ...colHeader, textAlign: "left" };

  const cell: React.CSSProperties = {
    padding: "0.75rem",
    textAlign: "right",
    fontSize: "0.9375rem",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };
  const cellLeft: React.CSSProperties = { ...cell, textAlign: "left" };

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{ border: `1px solid ${colours.border}` }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: `1px solid ${colours.border}` }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: colours.navyMid,
          }}
        >
          Monthly Ledger
        </span>
      </div>

      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colours.border}`, background: colours.bg }}>
              <th style={colHeaderLeft}>Period</th>
              <th style={colHeader}>Income</th>
              <th style={colHeader}>Expenses</th>
              <th style={colHeader}>Net</th>
              {hasMortgage && (
                <>
                  <th style={colHeader}>Principal</th>
                  <th style={colHeader}>Interest</th>
                  <th style={colHeader}>Balance</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.yyyyMM}
                style={{
                  borderBottom: i < rows.length - 1 ? `1px solid ${colours.border}` : undefined,
                }}
              >
                <td style={{ ...cellLeft, color: colours.navy, fontWeight: 500 }}>
                  {row.label}
                </td>
                <td style={{ ...cell, color: row.income > 0 ? colours.teal : colours.navyMuted }}>
                  {row.income > 0 ? fmt(row.income) : "—"}
                </td>
                <td style={{ ...cell, color: row.expenses > 0 ? colours.coral : colours.navyMuted }}>
                  {row.expenses > 0 ? fmt(row.expenses) : "—"}
                </td>
                <td
                  style={{
                    ...cell,
                    fontWeight: 600,
                    color:
                      row.net > 0
                        ? colours.teal
                        : row.net < 0
                        ? colours.coral
                        : colours.navyMuted,
                  }}
                >
                  {row.income === 0 && row.expenses === 0
                    ? "—"
                    : row.net > 0
                    ? fmt(row.net)
                    : row.net < 0
                    ? `−${fmt(Math.abs(row.net))}`
                    : "0"}
                </td>
                {hasMortgage && (
                  <>
                    <td style={{ ...cell, color: colours.navyMid }}>
                      {row.principal > 0 ? fmt(row.principal) : "—"}
                    </td>
                    <td style={{ ...cell, color: colours.navyMid }}>
                      {row.interest > 0 ? fmt(row.interest) : "—"}
                    </td>
                    <td style={{ ...cell, color: colours.navy }}>
                      {row.balance > 0 ? fmt(row.balance) : "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {purchaseFooter && (
        <div
          className="px-5 py-3"
          style={{
            borderTop: `1px solid ${colours.border}`,
            background: colours.bg,
            fontSize: "0.8125rem",
            fontStyle: "italic",
            color: colours.navyMid,
          }}
        >
          {purchaseFooter}
        </div>
      )}
    </div>
  );
}
