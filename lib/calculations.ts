import type { Entry, Meta } from "@/db/schema";

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
