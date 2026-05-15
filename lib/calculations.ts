import type { Entry, Meta } from "@/db/schema";

export type Period = string; // "3m" | "6m" | "12m" | "2025" | "2026 YTD" | "all-time"

export type Totals = {
  purchaseTotal: number;
  ongoingTotal: number;
  incomeTotal: number;
  monthlyOngoing: number;
  monthlyIncome: number;
  netMonthly: number;
  annualNet: number;
  propertyEquity: number;
  grossYield: number;
  netYield: number;
  pricePerM2: number;
  appreciationCZK: number;
  appreciationPct: number;
};

export function filterEntriesByPeriod(
  entries: Entry[],
  period: Period
): { filtered: Entry[]; monthCount: number } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (period === "all-time") {
    if (entries.length === 0) return { filtered: entries, monthCount: 1 };
    const earliest = entries
      .map((e) => new Date(e.date))
      .reduce((min, d) => (d < min ? d : min));
    const monthCount = Math.max(
      1,
      (today.getFullYear() - earliest.getFullYear()) * 12 +
        (today.getMonth() - earliest.getMonth()) +
        1
    );
    return { filtered: entries, monthCount };
  }

  const rollingMap: Record<string, number> = { "3m": 3, "6m": 6, "12m": 12 };
  if (period in rollingMap) {
    const n = rollingMap[period];
    const cutoff = new Date(today);
    cutoff.setMonth(cutoff.getMonth() - n);
    cutoff.setHours(0, 0, 0, 0);
    const filtered = entries.filter((e) => new Date(e.date) >= cutoff);
    return { filtered, monthCount: n };
  }

  if (period.endsWith(" YTD")) {
    const year = parseInt(period);
    const start = new Date(year, 0, 1);
    const filtered = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= today;
    });
    const monthCount = Math.max(1, today.getMonth() + 1);
    return { filtered, monthCount };
  }

  const year = parseInt(period);
  if (!isNaN(year)) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    const filtered = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
    return { filtered, monthCount: 12 };
  }

  return { filtered: entries, monthCount: 1 };
}

export function computeTotals(entries: Entry[], meta: Meta): Totals {
  const purchase = entries.filter((e) => e.section === "purchase");
  const ongoing = entries.filter((e) => e.section === "ongoing");
  const income = entries.filter((e) => e.section === "income");

  const sum = (arr: Entry[]) => arr.reduce((s, e) => s + Number(e.amount), 0);

  const purchaseTotal = sum(purchase);
  const ongoingTotal = sum(ongoing);
  const incomeTotal = sum(income);

  const monthlyOngoing = sum(ongoing.filter((e) => e.recurring));
  const monthlyIncome = sum(income.filter((e) => e.recurring));

  const netMonthly = monthlyIncome - monthlyOngoing;
  const annualNet = netMonthly * 12;

  const purchasePrice = Number(meta.purchasePrice);
  const propertyEquity = purchasePrice - Number(meta.mortgageAmount);
  const grossYield = purchasePrice ? (monthlyIncome * 12 / purchasePrice) * 100 : 0;
  const netYield = purchasePrice ? (annualNet / purchasePrice) * 100 : 0;

  const sizeM2 = Number(meta.sizeM2);
  const pricePerM2 = sizeM2 > 0 ? purchasePrice / sizeM2 : 0;

  const currentValue = Number(meta.currentPropertyValue ?? 0);
  const appreciationCZK = currentValue > 0 ? currentValue - purchasePrice : 0;
  const appreciationPct = purchasePrice > 0 && appreciationCZK !== 0
    ? (appreciationCZK / purchasePrice) * 100 : 0;

  return {
    purchaseTotal, ongoingTotal, incomeTotal,
    monthlyOngoing, monthlyIncome, netMonthly, annualNet,
    propertyEquity, grossYield, netYield,
    pricePerM2, appreciationCZK, appreciationPct,
  };
}

export function daysUntilRateReset(fixedUntil: string | null): number | null {
  if (!fixedUntil) return null;
  const diff = new Date(fixedUntil).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
