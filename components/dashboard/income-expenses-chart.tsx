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

export function IncomeExpensesChart({ entries }: Props) {
  const data = buildChartData(entries);

  if (data.length === 0) {
    return (
      <div
        className="bg-white border rounded-xl p-6"
        style={{ borderColor: "#E2D9CC" }}
      >
        <div className="text-[10px] uppercase tracking-widest font-bold mb-4" style={{ color: "rgba(30,58,74,0.5)" }}>
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
      <div className="text-[10px] uppercase tracking-widest font-bold mb-5" style={{ color: "rgba(30,58,74,0.5)" }}>
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
          <Tooltip
            cursor={{ fill: "rgba(30,58,74,0.04)" }}
            contentStyle={{
              border: "1px solid #E2D9CC",
              borderRadius: 8,
              fontSize: 12,
              color: "#1E3A4A",
              boxShadow: "0 2px 8px rgba(30,58,74,0.08)",
            }}
            formatter={(value, name) => [
              `${Number(value).toLocaleString("cs-CZ")} Kč`,
              name === "income" ? "Income" : "Expenses",
            ]}
          />
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
