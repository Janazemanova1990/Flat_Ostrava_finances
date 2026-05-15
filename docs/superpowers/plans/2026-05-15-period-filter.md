# Period Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add period filter chips (3m / 6m / 12m / year / YTD / All-time) to the dashboard that re-scope all KPIs to the selected window.

**Architecture:** Filter state lives in the `Dashboard` client component. All entries are already fetched by the server page — no new API calls. `filterEntriesByPeriod` slices the entries and returns a `monthCount`; `computeTotals` is updated to use actual entry averages instead of recurring-only logic. The server page stops pre-computing totals and passes raw entries + meta instead.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest, Tailwind CSS + inline styles (Navy/Teal/Coral palette)

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `lib/calculations.ts` | Modify | Add `filterEntriesByPeriod`, update `computeTotals` signature + monthly + equity logic |
| `lib/calculations.test.ts` | Create | Unit tests for both functions |
| `components/dashboard/period-filter.tsx` | Create | Chip strip UI, derives year chips from entries |
| `components/dashboard/dashboard.tsx` | Modify | Add period state, wire filter + computeTotals, render PeriodFilter |
| `app/(app)/page.tsx` | Modify | Remove computeTotals call, stop passing totals prop |

---

## Task 1: Add `filterEntriesByPeriod` to `lib/calculations.ts`

**Files:**
- Modify: `lib/calculations.ts`
- Create: `lib/calculations.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `lib/calculations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { filterEntriesByPeriod } from "./calculations";
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
```

- [ ] **Step 1.2: Run tests to confirm they fail**

```bash
pnpm test
```

Expected: fails with "filterEntriesByPeriod is not a function" or similar.

- [ ] **Step 1.3: Add `Period` type and `filterEntriesByPeriod` to `lib/calculations.ts`**

Add at the top of `lib/calculations.ts`, after the existing imports:

```ts
export type Period = string; // "3m" | "6m" | "12m" | "2025" | "2026 YTD" | "all-time"
```

Add this function before `computeTotals`:

```ts
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
```

- [ ] **Step 1.4: Run tests to confirm they pass**

```bash
pnpm test
```

Expected: all `filterEntriesByPeriod` tests PASS, existing mortgage tests still PASS.

- [ ] **Step 1.5: Commit**

```bash
git add lib/calculations.ts lib/calculations.test.ts
git commit -m "feat: add filterEntriesByPeriod with full period type support"
```

---

## Task 2: Update `computeTotals` — actual averages + corrected equity

**Files:**
- Modify: `lib/calculations.ts`
- Modify: `lib/calculations.test.ts`

- [ ] **Step 2.1: Write failing tests for updated `computeTotals`**

Add this block to `lib/calculations.test.ts` (after the existing `filterEntriesByPeriod` tests):

```ts
import { computeTotals } from "./calculations";
import type { Meta } from "@/db/schema";

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
    const allEntries = [
      entry("2025-01-01", "income", "15000"),
      entry("2025-02-01", "income", "15000"),
      entry("2025-03-01", "income", "15000"),
    ];
    const totals = computeTotals(allEntries, allEntries, baseMeta, 3);
    expect(totals.monthlyIncome).toBeCloseTo(15000, 0);
  });

  it("monthlyOngoing = sum of ongoing entries / monthCount", () => {
    const allEntries = [
      entry("2025-01-01", "ongoing", "20000"),
      entry("2025-02-01", "ongoing", "20000"),
    ];
    const totals = computeTotals(allEntries, allEntries, baseMeta, 2);
    expect(totals.monthlyOngoing).toBeCloseTo(20000, 0);
  });

  it("purchaseTotal always uses allEntries even when filteredEntries is empty", () => {
    const allEntries = [entry("2024-01-01", "purchase", "500000")];
    const totals = computeTotals([], allEntries, baseMeta, 1);
    expect(totals.purchaseTotal).toBe(500000);
  });

  it("propertyEquity = currentPropertyValue - remainingMortgageBalance", () => {
    const totals = computeTotals([], [], baseMeta, 1);
    // remainingBalance = 2400000 - principalPaid (small after ~5 months)
    // equity should be close to 3200000 - ~2400000 = ~800000
    expect(totals.propertyEquity).toBeGreaterThan(790000);
    expect(totals.propertyEquity).toBeLessThan(810000);
  });

  it("propertyEquity falls back to purchasePrice - remainingBalance when no currentPropertyValue", () => {
    const meta = { ...baseMeta, currentPropertyValue: null };
    const totals = computeTotals([], [], meta, 1);
    expect(totals.propertyEquity).toBeGreaterThan(590000);
    expect(totals.propertyEquity).toBeLessThan(610000);
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
pnpm test
```

Expected: new `computeTotals` tests fail because the function signature still takes `(entries, meta)`.

- [ ] **Step 2.3: Update `computeTotals` in `lib/calculations.ts`**

Replace the entire `computeTotals` function (keep the `Totals` type and `daysUntilRateReset` unchanged):

```ts
import { totalsToDate, type MortgageParams } from "./mortgage";
```

Add the import at the top of `lib/calculations.ts` (after the existing `import type { Entry, Meta }`).

Then replace the `computeTotals` function body:

```ts
export function computeTotals(
  filteredEntries: Entry[],
  allEntries: Entry[],
  meta: Meta,
  monthCount: number
): Totals {
  const purchase = allEntries.filter((e) => e.section === "purchase");
  const ongoing = filteredEntries.filter((e) => e.section === "ongoing");
  const income = filteredEntries.filter((e) => e.section === "income");

  const sum = (arr: Entry[]) => arr.reduce((s, e) => s + Number(e.amount), 0);

  const purchaseTotal = sum(purchase);
  const ongoingTotal = sum(ongoing);
  const incomeTotal = sum(income);

  const monthlyOngoing = monthCount > 0 ? sum(ongoing) / monthCount : 0;
  const monthlyIncome = monthCount > 0 ? sum(income) / monthCount : 0;
  const netMonthly = monthlyIncome - monthlyOngoing;
  const annualNet = netMonthly * 12;

  const purchasePrice = Number(meta.purchasePrice);
  const mortgageAmount = Number(meta.mortgageAmount);
  const currentValue = Number(meta.currentPropertyValue ?? 0);

  let principalPaid = 0;
  if (
    meta.mortgageStartDate &&
    Number(meta.mortgageRate) > 0 &&
    mortgageAmount > 0 &&
    meta.mortgageTermYears > 0
  ) {
    const params: MortgageParams = {
      principal: mortgageAmount,
      annualRate: Number(meta.mortgageRate),
      termYears: meta.mortgageTermYears,
      startDate: meta.mortgageStartDate,
    };
    principalPaid = totalsToDate(params).principalPaid;
  }
  const remainingBalance = Math.max(0, mortgageAmount - principalPaid);
  const baseValue = currentValue > 0 ? currentValue : purchasePrice;
  const propertyEquity = baseValue - remainingBalance;

  const grossYield = purchasePrice ? (monthlyIncome * 12 / purchasePrice) * 100 : 0;
  const netYield = purchasePrice ? (annualNet / purchasePrice) * 100 : 0;

  const sizeM2 = Number(meta.sizeM2);
  const pricePerM2 = sizeM2 > 0 ? purchasePrice / sizeM2 : 0;

  const appreciationCZK = currentValue > 0 ? currentValue - purchasePrice : 0;
  const appreciationPct =
    purchasePrice > 0 && appreciationCZK !== 0
      ? (appreciationCZK / purchasePrice) * 100
      : 0;

  return {
    purchaseTotal, ongoingTotal, incomeTotal,
    monthlyOngoing, monthlyIncome, netMonthly, annualNet,
    propertyEquity, grossYield, netYield,
    pricePerM2, appreciationCZK, appreciationPct,
  };
}
```

- [ ] **Step 2.4: Run tests to confirm they pass**

```bash
pnpm test
```

Expected: all tests PASS including mortgage tests.

- [ ] **Step 2.5: Commit**

```bash
git add lib/calculations.ts lib/calculations.test.ts
git commit -m "feat: update computeTotals — actual averages by monthCount, correct equity formula"
```

---

## Task 3: Create `PeriodFilter` component

**Files:**
- Create: `components/dashboard/period-filter.tsx`

- [ ] **Step 3.1: Create the component**

Create `components/dashboard/period-filter.tsx`:

```tsx
"use client";
import type { Entry } from "@/db/schema";
import type { Period } from "@/lib/calculations";

type Props = {
  selected: Period;
  onChange: (p: Period) => void;
  entries: Entry[];
};

export function PeriodFilter({ selected, onChange, entries }: Props) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const years = Array.from(
    new Set(entries.map((e) => new Date(e.date).getFullYear()))
  ).sort((a, b) => a - b);

  const yearChips: Period[] = years.map((y) =>
    y === currentYear ? `${y} YTD` : String(y)
  );

  const chips: Period[] = ["3m", "6m", "12m", ...yearChips, "all-time"];

  const label = (chip: Period) => (chip === "all-time" ? "All-time" : chip);

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip === selected;
        return (
          <button
            key={chip}
            onClick={() => onChange(chip)}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            style={
              active
                ? {
                    background: "#1E3A4A",
                    color: "#F5F0E8",
                    border: "1px solid #1E3A4A",
                  }
                : {
                    background: "transparent",
                    color: "#1E3A4A",
                    border: "1px solid #E2D9CC",
                  }
            }
          >
            {label(chip)}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep -E "error|warning" | head -20
```

Expected: no TypeScript errors related to `period-filter.tsx`.

- [ ] **Step 3.3: Commit**

```bash
git add components/dashboard/period-filter.tsx
git commit -m "feat: add PeriodFilter chip component"
```

---

## Task 4: Wire up `Dashboard` and update `DashboardPage`

**Files:**
- Modify: `components/dashboard/dashboard.tsx`
- Modify: `app/(app)/page.tsx`

- [ ] **Step 4.1: Update `app/(app)/page.tsx`**

Replace the entire file content with:

```ts
export const dynamic = "force-dynamic";

import { db } from "@/db";
import { entries, meta } from "@/db/schema";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function DashboardPage() {
  const [allEntries, metaRow] = await Promise.all([
    db.select().from(entries),
    db.query.meta.findFirst(),
  ]);

  const metaData = metaRow ?? {
    id: 1,
    propertyName: "Ostrava - Nádražní 2965/9",
    purchasePrice: "0",
    mortgageAmount: "0",
    targetMonthlyRent: "0",
    sizeM2: "0",
    mortgageRate: "0",
    mortgageTermYears: 30,
    mortgageStartDate: null,
    mortgageRateFixedUntil: null,
    currentPropertyValue: null,
    currentPropertyValueUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return <Dashboard meta={metaData} entries={allEntries} />;
}
```

- [ ] **Step 4.2: Update `components/dashboard/dashboard.tsx`**

Replace the entire file content with:

```tsx
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
                style={{
                  color: hasRent ? "#1E3A4A" : "rgba(30,58,74,0.32)",
                }}
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
```

- [ ] **Step 4.3: Run full build to catch TypeScript errors**

```bash
pnpm build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` with no type errors.

- [ ] **Step 4.4: Run all tests**

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 4.5: Verify locally**

Start dev server if not already running:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Check:
1. Chips row appears between header and KPI card
2. "All-time" is selected by default
3. Clicking "3m" updates KPI values
4. Clicking a year chip (e.g. "2025") updates values
5. Property equity reflects current estimate - remaining balance
6. Purchase costs stay constant regardless of chip selected

- [ ] **Step 4.6: Commit**

```bash
git add components/dashboard/dashboard.tsx app/\(app\)/page.tsx
git commit -m "feat: wire period filter into dashboard — client-side KPI scoping"
```

---

## Self-review checklist

- [x] `filterEntriesByPeriod` — all 6 period types covered in tests and implementation
- [x] `computeTotals` — new signature `(filteredEntries, allEntries, meta, monthCount)` consistent across all tasks
- [x] `purchaseTotal` uses `allEntries` throughout
- [x] `propertyEquity` uses `currentPropertyValue - remainingBalance` with fallback to `purchasePrice - remainingBalance`
- [x] `Period` type exported from `lib/calculations.ts`, imported in `period-filter.tsx` and `dashboard.tsx`
- [x] `DashboardPage` no longer imports or calls `computeTotals`
- [x] `Dashboard` props changed from `{ totals, meta, entries }` to `{ meta, entries }` — both files updated in Task 4
- [x] `onUpdateRate` callback in `RateNotification` — wired to no-op `() => {}` since `setShowMetaEditor` was removed; this matches existing behaviour (the meta editor is accessible via the header edit button)
