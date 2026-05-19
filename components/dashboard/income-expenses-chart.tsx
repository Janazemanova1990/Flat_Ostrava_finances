"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import type { Entry } from "@/db/schema";

type Props = { entries: Entry[] };

function buildChartData(entries: Entry[]) {
  const map = new Map<string, { income: number; expenses: number }>();

  for (const e of entries) {
    if (e.section === "purchase") continue;
    const month = e.date.slice(0, 7); // "YYYY-MM"
    if (!map.has(month)) map.set(month, { income: 0, expenses: 0 });
    const row = map.get(month)!;
    if (e.section === "income") row.income += Number(e.amount);
    if (e.section === "ongoing") row.expenses += Number(e.amount);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expenses }]) => ({
      month: formatMonth(month),
      income: Math.round(income),
      expenses: Math.round(expenses),
    }));
}

function formatMonth(ym: string) {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en", { month: "short" }) + (
    // show year suffix when data spans multiple years
    " '" + String(year).slice(2)
  );
}

function fmtK(v: number) {
  if (v === 0) return "0";
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

function fmt(v: number) {
  return `${v.toLocaleString("cs-CZ")} Kč`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0;
  const expenses = payload.find((p: any) => p.dataKey === "expenses")?.value ?? 0;
  const net = income - expenses;
  return (
    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "white", border: "1px solid #E2D9CC", boxShadow: "0 4px 16px rgba(30,58,74,0.10)", minWidth: 180 }}>
      <div className="font-semibold mb-2" style={{ color: "#1E3A4A" }}>{label}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-6" style={{ color: "rgba(30,58,74,0.5)" }}>
          <span>Income</span>
          <span className="tabular-nums font-medium" style={{ color: "#3D8070" }}>{fmt(income)}</span>
        </div>
        <div className="flex justify-between gap-6" style={{ color: "rgba(30,58,74,0.5)" }}>
          <span>Expenses</span>
          <span className="tabular-nums font-medium" style={{ color: "#D4684A" }}>{fmt(expenses)}</span>
        </div>
        <div className="pt-1 mt-1 flex justify-between gap-6 font-semibold" style={{ borderTop: "1px solid #E2D9CC" }}>
          <span style={{ color: "rgba(30,58,74,0.6)" }}>Net</span>
          <span className="tabular-nums" style={{ color: net >= 0 ? "#3D8070" : "#D4684A" }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function IncomeExpensesChart({ entries }: Props) {
  const data = buildChartData(entries);

  if (data.length === 0) {
    return (
      <div
        className="bg-white border rounded-xl p-6"
        style={{ borderColor: "#E2D9CC" }}
      >
        <div className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: "rgba(30,58,74,0.5)" }}>
          Monthly income vs expenses
        </div>
        <p className="text-sm text-center py-8" style={{ color: "rgba(30,58,74,0.4)" }}>
          No data for selected period
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white border rounded-xl p-5 sm:p-6"
      style={{ borderColor: "#E2D9CC" }}
    >
      <div className="text-xs uppercase tracking-widest font-bold mb-5" style={{ color: "rgba(30,58,74,0.5)" }}>
        Monthly income vs expenses
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={2} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#E2D9CC" strokeDasharray="0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "rgba(30,58,74,0.5)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "rgba(30,58,74,0.5)" }}
            tickFormatter={fmtK}
            width={36}
          />
          <Tooltip cursor={{ fill: "rgba(30,58,74,0.04)" }} content={<CustomTooltip />} />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 12, color: "rgba(30,58,74,0.6)", paddingTop: 12 }}
            formatter={(v) => v === "income" ? "Income" : "Expenses"}
          />
          <Bar dataKey="income" fill="#3D8070" radius={[3, 3, 0, 0]} />
          <Bar dataKey="expenses" fill="rgba(212,104,74,0.25)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
