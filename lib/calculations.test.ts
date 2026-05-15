import { describe, it, expect } from "vitest";
import { filterEntriesByPeriod, computeTotals } from "./calculations";
import type { Meta } from "@/db/schema";
import type { Entry } from "@/db/schema";

function d(offsetMonths: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  return date.toISOString().slice(0, 10);
}

function entry(date: string, section = "ongoing", amount = "1000"): Entry {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    section,
    date,
    category: "Test",
    description: null,
    amount,
    recurring: false,
    notes: null,
    taxDeductible: false,
    invoiceUrl: null,
    invoiceFilename: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("filterEntriesByPeriod", () => {
  describe("all-time", () => {
    it("returns all entries unchanged", () => {
      const entries = [entry(d(-5)), entry(d(-2)), entry(d(0))];
      const { filtered } = filterEntriesByPeriod(entries, "all-time");
      expect(filtered).toHaveLength(3);
    });

    it("monthCount = months from earliest entry to today (min 1)", () => {
      const entries = [entry(d(-5)), entry(d(0))];
      const { monthCount } = filterEntriesByPeriod(entries, "all-time");
      expect(monthCount).toBeGreaterThanOrEqual(5);
      expect(monthCount).toBeLessThanOrEqual(7);
    });

    it("returns monthCount 1 with no entries", () => {
      const { filtered, monthCount } = filterEntriesByPeriod([], "all-time");
      expect(filtered).toHaveLength(0);
      expect(monthCount).toBe(1);
    });
  });

  describe("rolling periods", () => {
    it("3m: includes entry from 2 months ago, excludes entry from 4 months ago", () => {
      const entries = [entry(d(-2)), entry(d(-4))];
      const { filtered, monthCount } = filterEntriesByPeriod(entries, "3m");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].date).toBe(d(-2));
      expect(monthCount).toBe(3);
    });

    it("6m: monthCount is 6", () => {
      const { monthCount } = filterEntriesByPeriod([], "6m");
      expect(monthCount).toBe(6);
    });

    it("12m: monthCount is 12", () => {
      const { monthCount } = filterEntriesByPeriod([], "12m");
      expect(monthCount).toBe(12);
    });
  });

  describe("calendar year", () => {
    it("filters entries to the given year only, monthCount = 12", () => {
      const entries = [
        entry("2025-03-15"),
        entry("2025-11-01"),
        entry("2024-12-31"),
        entry("2026-01-01"),
      ];
      const { filtered, monthCount } = filterEntriesByPeriod(entries, "2025");
      expect(filtered).toHaveLength(2);
      expect(monthCount).toBe(12);
    });
  });

  describe("YTD", () => {
    it("filters entries from Jan 1 of the year to today", () => {
      const year = new Date().getFullYear();
      const entries = [
        entry(`${year}-01-01`),
        entry(`${year - 1}-12-31`),
      ];
      const { filtered } = filterEntriesByPeriod(entries, `${year} YTD`);
      expect(filtered).toHaveLength(1);
    });

    it("monthCount = months elapsed in year (min 1)", () => {
      const year = new Date().getFullYear();
      const { monthCount } = filterEntriesByPeriod([], `${year} YTD`);
      expect(monthCount).toBeGreaterThanOrEqual(1);
      expect(monthCount).toBeLessThanOrEqual(12);
    });
  });
});

const baseMeta: Meta = {
  id: 1,
  propertyName: "Test",
  purchasePrice: "3000000",
  mortgageAmount: "2400000",
  targetMonthlyRent: "0",
  sizeM2: "60",
  mortgageRate: "0.0464",
  mortgageTermYears: 30,
  mortgageStartDate: "2025-12-01",
  mortgageRateFixedUntil: null,
  currentPropertyValue: "3200000",
  currentPropertyValueUpdatedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("computeTotals", () => {
  it("monthlyIncome = sum of income entries / monthCount", () => {
    const all = [
      entry("2025-01-01", "income", "15000"),
      entry("2025-02-01", "income", "15000"),
      entry("2025-03-01", "income", "15000"),
    ];
    const totals = computeTotals(all, all, baseMeta, 3);
    expect(totals.monthlyIncome).toBeCloseTo(15000, 0);
  });

  it("monthlyOngoing = sum of ongoing entries / monthCount", () => {
    const all = [
      entry("2025-01-01", "ongoing", "20000"),
      entry("2025-02-01", "ongoing", "20000"),
    ];
    const totals = computeTotals(all, all, baseMeta, 2);
    expect(totals.monthlyOngoing).toBeCloseTo(20000, 0);
  });

  it("purchaseTotal always uses allEntries even when filteredEntries is empty", () => {
    const allEntries = [entry("2024-01-01", "purchase", "500000")];
    const totals = computeTotals([], allEntries, baseMeta, 1);
    expect(totals.purchaseTotal).toBe(500000);
  });

  it("propertyEquity = currentPropertyValue - remainingMortgageBalance", () => {
    const totals = computeTotals([], [], baseMeta, 1);
    // currentValue=3200000, remaining≈2400000-principalPaid(~5mo)
    expect(totals.propertyEquity).toBeGreaterThan(790000);
    expect(totals.propertyEquity).toBeLessThan(820000);
  });

  it("propertyEquity falls back to purchasePrice - remainingBalance when no currentPropertyValue", () => {
    const meta = { ...baseMeta, currentPropertyValue: null };
    const totals = computeTotals([], [], meta, 1);
    // purchasePrice=3000000, remaining≈2400000-principalPaid(~5mo)≈2380000 → equity≈620000
    expect(totals.propertyEquity).toBeGreaterThan(590000);
    expect(totals.propertyEquity).toBeLessThan(630000);
  });
});
