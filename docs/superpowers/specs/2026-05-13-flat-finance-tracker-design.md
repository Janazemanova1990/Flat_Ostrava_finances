# Flat Finance Tracker — Full Design Spec
_Brainstormed: 2026-05-13. Pairs with `ARCHITECTURE.md` (base technical spec) and `CLAUDE.md` (conventions)._

---

## 1. What we're building

A personal Next.js 15 web app for Jana to track all finances related to her Ostrava flat (Nádražní 2965/9, 59 m²): purchase costs, ongoing expenses, rental income, mortgage payoff, and property appreciation. Single-user, deployed to Vercel, Postgres on Neon.

This spec extends `ARCHITECTURE.md` with all decisions made during the 2026-05-13 design session. Where this spec and ARCHITECTURE.md conflict, this spec wins.

---

## 2. Visual design system

### Palette — Sage & Blush
| Role | Value |
|---|---|
| Page background | `#f4f7f4` |
| Background gradient top-right | `rgba(134,179,134,0.15)` sage |
| Background gradient bottom-left | `rgba(210,169,169,0.12)` blush |
| Card background | `white` |
| Card border | `#d4e0d4` |
| Primary text | `#2d3b2d` |
| Primary action (buttons, active tab) | `#3d5c3d` |
| Muted text / labels | `#8faa8f` |
| Eyebrow / secondary text | `#5f7a5f` |
| Income / positive | `#2d6a2d` (emerald shade) |
| Tax deductible accent | `#8b4a4a` rose |
| Tax deductible bg | `#f5e8e8` |
| Recurring accent | `#3d5c3d` |
| Mortgage property section bg | `#1c1917` dark (kept from prototype) |
| Mortgage interest section bg | `#f5f3ff` lavender |
| Mortgage interest section border | `#ddd6fe` |
| Mortgage interest accent | `#6d28d9` purple |
| Rate notification bg | `#fffbeb` amber |
| Rate notification border | `#fcd34d` |

### Typography
- Display headings: Fraunces, medium weight
- Body: Inter, 13-14px
- Tabular numbers: all money amounts

### Cards
- `background: white`, `border: 1px solid #d4e0d4`, `border-radius: 12px`
- Input fields: `background: #f4f7f4`, same border

---

## 3. Property header (global)

Shown at the top of every page. Contains:
- Eyebrow: "🏠 Property Finance"
- Property name: "Ostrava — Nádražní 2965/9" (Fraunces, large)
- Chips row:
  - `59 m²`
  - `3 799 000 Kč` (purchase price)
  - `64 390 Kč / m²` (calculated: purchase price ÷ size_m2, highlighted in sage chip)
  - `10% down · 379 900 Kč equity`
  - `✎ edit` → opens MetaEditor
- Export buttons (JSON backup, CSV, Import) — right side

Price per m² recalculates whenever purchase price or size_m2 changes.

---

## 4. Dashboard layout (full scroll — no collapsing)

All sections visible on load, scrollable. Order top to bottom:

### 4.1 Rate reset notification banner
- **Condition:** shown when `mortgage_rate_fixed_until` is within 60 days of today
- Amber background (`#fffbeb`), amber border (`#fcd34d`)
- Text: "Your fixed rate **4.64%** expires in **N days** (May 2029). Contact your bank to renegotiate, then update your rate here."
- "Update rate" button → opens MetaEditor focused on mortgage fields
- Dismissed automatically once rate is updated (new `mortgage_rate_fixed_until` set)

### 4.2 KPI cards (3-column grid)
| Card | Value | Sublabel |
|---|---|---|
| Total invested | `purchaseTotal + ongoingTotal − incomeTotal` | "Purchase + expenses − income" |
| Net monthly cash flow | `monthlyIncome − monthlyOngoing` | "{income} rent − {expenses} costs" |
| Net yield | `(annualNet / purchasePrice) × 100` % | "Gross: X %" |

Cash flow positive → `#2d6a2d`, negative → rose

### 4.3 Mini stats (3-column grid)
Purchase costs · Expenses to date · Income received

### 4.4 Financing breakdown
Horizontal bar: mortgage portion (dark) + equity portion (sage green). Labels below.

### 4.5 Mortgage payoff card
Monthly payment strip across the top:
```
17 618 Kč/month  =  4 395 Kč → your property  +  13 223 Kč → interest
```

**Section 1 — Going to your property (dark `#1c1917` card):**
- Principal paid to date (emerald)
- Remaining balance
- Progress bar (thin, `#d1fae5` on dark)
- Bar labels: "X% yours so far" · "payoff: Month Year"
- 3 pills: principal/month · % of payment → equity · time remaining

**Section 2 — Interest payments (lavender card):**
- Interest paid this month (purple)
- Projected total interest over loan life (right)
- Progress bar (purple on `#ddd6fe`)
- Bar labels: "X% of total interest paid" · "total over 30 years"
- 3 pills: interest/month · % of payment → bank · total projected interest

Footer note: "Calculated automatically · update rate when fixed period resets · 30 year term"

**Mortgage calculation inputs (stored in meta):**
- `mortgage_amount`: 3 419 100 Kč (purchase price × 0.9)
- `mortgage_rate`: 4.64%
- `mortgage_term_years`: 30
- `mortgage_start_date`: date mortgage began
- `mortgage_rate_fixed_until`: May 2029

Formula: standard annuity `M = P × r(1+r)^n / ((1+r)^n − 1)`. Per-payment principal/interest split computed in `/lib/mortgage.ts`.

### 4.6 Property value card
| Field | Value |
|---|---|
| Purchased at | 3 799 000 Kč |
| Current estimate | manually entered |
| Gain | estimate − purchase (Kč + %) |

"Update estimate" button → inline edit field. No auto-calculation — Jana updates from Sreality.cz or valuation, whenever she wants.

### 4.7 Recent activity
Last 8 transactions across all sections, sorted by date desc. Income dot green, expense/purchase dot sage.

---

## 5. Entry sections (Purchase / Expenses / Income)

### 5.1 Entry form fields

| Field | Purchase | Expenses | Income |
|---|---|---|---|
| Date | ✅ | ✅ | ✅ |
| Category | ✅ | ✅ | ✅ |
| Amount (Kč) | ✅ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ |
| Notes | ✅ | ✅ | ✅ |
| Monthly recurring | ❌ | ✅ | ✅ |
| Tax deductible | ❌ | ✅ | ✅ |
| Invoice upload | ✅ | ✅ | ✅ |

**Monthly recurring checkbox** — sage green, used for cash flow calculations
**Tax deductible checkbox** — rose (`#8b4a4a`), used for tax export filtering
**Invoice upload** — dashed drop zone when empty; shows filename + size + remove when attached. Accepts PDF, JPG, PNG, max 10 MB. Stored in Vercel Blob.

### 5.2 Entry list badges
Each entry row shows small pills:
- `↻ monthly` — sage green — if recurring
- `⊛ tax` — rose — if tax_deductible
- `📄 invoice` — sage green, clickable to open/download — if invoice attached

Entries grouped by category. Category group header shows category name + subtotal.

---

## 6. Tax export

Accessible from the Expenses/Income pages (or a dedicated export button).

Filter options:
- Tax year (2025, 2026, …)
- Tax deductible only: yes / all
- Section: expenses / income / both

Export options:
- **CSV** — filtered entries with all fields including tax_deductible flag
- **ZIP** — CSV + all invoice files for matching entries, named `{date}-{category}-{description}.pdf`

API: `GET /api/export?format=tax&year=2026&section=expenses`

---

## 7. Data model (additions to ARCHITECTURE.md)

### `meta` table — new columns
| Column | Type | Notes |
|---|---|---|
| `size_m2` | numeric(5,1) | Flat size — 59.0 |
| `mortgage_rate` | numeric(5,4) | e.g. 0.0464 |
| `mortgage_term_years` | integer | 30 |
| `mortgage_start_date` | date | When mortgage began |
| `mortgage_rate_fixed_until` | date | Triggers notification when ≤60 days away |
| `current_property_value` | numeric(12,2) | Manually updated estimate |
| `current_property_value_updated_at` | timestamptz | When estimate was last set |

### `entries` table — new columns
| Column | Type | Default | Notes |
|---|---|---|---|
| `tax_deductible` | boolean | false | Included in tax export filter |
| `invoice_url` | text | null | Vercel Blob URL |
| `invoice_filename` | text | null | Original filename for display |

---

## 8. New API routes (additions to ARCHITECTURE.md)

### `POST /api/upload`
Uploads invoice file to Vercel Blob. Returns `{ url, filename, size }`.
Body: `multipart/form-data` with `file` field.
Validates: max 10 MB, accepted MIME types (pdf, jpeg, png).

### `DELETE /api/upload`
Body: `{ url }`. Deletes from Vercel Blob. Called when entry is deleted or invoice is replaced.

### `GET /api/export?format=tax&year=YYYY&section=expenses|income|both`
Returns ZIP: `flat-tax-export-{year}.zip` containing:
- `entries.csv` — filtered + labelled entries
- `invoices/` — all attached invoice files for matching entries

---

## 9. New lib modules (additions to ARCHITECTURE.md)

### `/lib/mortgage.ts`
Pure functions. No DB, no React.

```ts
type MortgageParams = {
  principal: number;       // loan amount in CZK
  annualRate: number;      // e.g. 0.0464
  termYears: number;       // 30
  startDate: string;       // ISO date
};

// Monthly payment (annuity formula)
export function monthlyPayment(p: MortgageParams): number

// For a given month number (1-based), split into principal + interest
export function paymentSplit(p: MortgageParams, monthNumber: number): {
  principal: number;
  interest: number;
  remainingBalance: number;
}

// Totals to date (from month 1 to current month)
export function totalsToDate(p: MortgageParams): {
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  monthsElapsed: number;
  totalProjectedInterest: number;
  payoffDate: string;
}
```

### `/lib/calculations.ts` — additions
```ts
// Adds to existing computeTotals():
pricePerM2: meta.purchasePrice / meta.sizeM2   // 0 if sizeM2 = 0
appreciationCZK: meta.currentPropertyValue - meta.purchasePrice
appreciationPct: (appreciationCZK / meta.purchasePrice) * 100
```

---

## 10. New environment variables

```
BLOB_READ_WRITE_TOKEN=       # Vercel Blob — add to Vercel dashboard + .env.local
```

Add to `.env.example`.

---

## 11. Build order (updated from ARCHITECTURE.md §12)

1. `package.json` + base Next.js setup (Tailwind, TypeScript, shadcn/ui, `@vercel/blob`)
2. `/lib/constants.ts` — categories + CZK formatter + sage/blush colour tokens
3. `/db/schema.ts` + `drizzle.config.ts` + first migration (includes all new columns)
4. `/db/index.ts`
5. `/lib/auth.ts` + `/middleware.ts` + `/app/login/page.tsx` + `/api/auth/*`
6. `/lib/mortgage.ts` — amortisation functions + unit tests
7. `/lib/calculations.ts` — computeTotals + mortgage + appreciation
8. API routes: `/api/meta`, `/api/entries`, `/api/entries/[id]`, `/api/upload`
9. Layout shell: `/app/(app)/layout.tsx` + property header + `<MetaEditor />` + `<TabNav />`
10. `<EntrySection />` + entry form (with invoice upload + tax checkbox) + `/app/(app)/purchase|expenses|income/page.tsx`
11. Dashboard: rate banner + KPI cards + mortgage card + property value card + recent activity
12. Export/import: `/api/export` (JSON, CSV, tax ZIP), `/api/import`, `<BackupButtons />`
13. Polish: empty states, loading states, error states, rate notification logic
14. Deploy to Vercel: set env vars, run migration, verify

---

## 12. Out of scope (do not build)

Everything in ARCHITECTURE.md §"What's out of scope", plus:
- Free-form tags (categories cover the filtering need)
- Hardcoded property appreciation rate (manual estimate only)
- Bank feed / automatic transaction import
- Multiple tenants or properties
- Email notifications (in-app banner is enough for rate reset)
