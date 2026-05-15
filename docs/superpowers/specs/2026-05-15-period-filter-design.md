# Period Filter — Design Spec
_2026-05-15_

## Overview

Add time period filter chips to the dashboard so all KPIs and totals reflect only the selected window. Filter state is client-side; all entries are already fetched by the server page.

---

## Period definitions

| Chip | Window | Month divisor |
|---|---|---|
| `3m` | Today − 3 months → today | 3 |
| `6m` | Today − 6 months → today | 6 |
| `12m` | Today − 12 months → today | 12 |
| `2025` | Jan 1 – Dec 31 2025 | 12 |
| `2026 YTD` | Jan 1 2026 → today | months elapsed in year (min 1) |
| `All-time` | All entries | months from first entry date → today (min 1) |

- Year chips are derived dynamically from entry dates — unique years in the dataset, with the current year labelled "YTD".
- Default selected chip: **All-time**.
- Rolling chips (3m / 6m / 12m) are always shown regardless of entry data.

---

## Data flow

`DashboardPage` (server component) continues to fetch all entries unchanged — no server-side modifications.

Inside `Dashboard` (client component):
1. `selectedPeriod` state (type `Period`, default `"all-time"`)
2. On every render: `filterEntriesByPeriod(entries, selectedPeriod)` → `{ filtered, monthCount }`
3. `computeTotals(filtered, meta, monthCount)` → period-scoped totals
4. KPI card consumes those totals

`PeriodFilter` component renders the chips, sits between the property header and KPI card. `Dashboard` owns state, passes `selected` + `onChange` down.

### Which KPIs filter vs stay static

| KPI | Behaviour |
|---|---|
| Property equity | Static — `currentPropertyValue − remainingMortgageBalance` |
| Net monthly cash flow | Filtered — `sum(income in period) / monthCount − sum(expenses in period) / monthCount` |
| Purchase costs (support tier) | Static — always all-time (one-time acquisition fact) |
| Property value (support tier) | Static — always current estimate from meta |
| Net yield | Filtered — derived from filtered monthly figures |

---

## Calculations changes (`lib/calculations.ts`)

### New: `filterEntriesByPeriod(entries, period)`

```ts
type Period = "3m" | "6m" | "12m" | string // string covers "2025", "2026 YTD", "all-time"

function filterEntriesByPeriod(
  entries: Entry[],
  period: Period
): { filtered: Entry[]; monthCount: number }
```

- Rolling periods: filter `entry.date >= subMonths(today, N)`
- Year chips (e.g. `"2025"`): filter `entry.date` within that calendar year, monthCount = 12
- YTD chip (e.g. `"2026 YTD"`): filter Jan 1 of year → today, monthCount = months elapsed (min 1)
- All-time: no filter, monthCount = months between earliest entry date and today (min 1)

### Modified: `computeTotals(entries, meta, monthCount)`

`monthCount` becomes a required parameter. Monthly figures change from recurring-only to actual averages:

```ts
monthlyIncome  = sum(income entries) / monthCount
monthlyOngoing = sum(ongoing entries) / monthCount
netMonthly     = monthlyIncome - monthlyOngoing
annualNet      = netMonthly * 12
```

`propertyEquity` changes from `purchasePrice − mortgageAmount` to:

```ts
propertyEquity = currentPropertyValue − (mortgageAmount − principalPaid)
```

where `principalPaid` is derived from `totalsToDate(mortgageParams)`. `computeTotals` accepts raw meta and derives `mortgageParams` internally to keep `DashboardPage` clean.

`purchaseTotal`, `pricePerM2`, `appreciationCZK/Pct` — always computed from all entries / meta, unaffected by period.

---

## Components

### New: `components/dashboard/period-filter.tsx`

- Props: `selected: Period`, `onChange: (p: Period) => void`, `entries: Entry[]`
- Derives year chips from `entries` — unique years, current year as "YTD"
- Always renders rolling chips: 3m, 6m, 12m
- Always renders All-time chip
- Active chip: navy background (`#1E3A4A`) + cream text (`#F5F0E8`)
- Inactive chips: outline style matching existing property header chips

### Modified: `components/dashboard/dashboard.tsx`

- Add `selectedPeriod` state
- Call `filterEntriesByPeriod` + `computeTotals` on every render
- Render `<PeriodFilter>` between property header and KPI card

### Modified: `lib/calculations.ts`

- Add `filterEntriesByPeriod`
- Update `computeTotals` signature and monthly + equity logic

### Unchanged

`app/(app)/page.tsx`, `MortgageCard`, `PropertyValueCard`, `RecentActivity`, `PropertyHeader` — no changes.

---

## Out of scope

- Property value history per year (separate feature — requires new DB table)
- Filtering the mortgage card or recent activity by period
- URL-based period state
