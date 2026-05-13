# Architecture — Flat Finance Tracker

Detailed technical design for the production app. Pairs with `CLAUDE.md` (which gives Claude Code the conventions and project shape). This document describes *what* to build; CLAUDE.md describes *how* to build it.

---

## 1. System overview

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Jana)                      │
│   Next.js client components, password cookie, fetch()    │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Vercel (Next.js 15)                     │
│  ┌────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │ Middleware │ → │ Server pages │ ← │  API routes   │  │
│  │  (auth)    │   │  (RSC)       │   │  (mutations)  │  │
│  └────────────┘   └──────────────┘   └───────┬───────┘  │
└──────────────────────────────────────────────┼──────────┘
                                               │ Drizzle ORM
                                               ▼
                                  ┌──────────────────────┐
                                  │   Neon Postgres      │
                                  │   (serverless)       │
                                  └──────────────────────┘
```

Single Next.js app, deployed as one Vercel project. Postgres is external (Neon). Invoice/receipt files stored in Vercel Blob. No background jobs, no queues, no caching layer needed at this scale.

---

## 2. Data model

### Table: `meta`

Single row table (enforced via `id = 1` constraint). Holds property metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | integer | Primary key, always `1` |
| `property_name` | text | "Ostrava — Nádražní 2965/9" |
| `purchase_price` | numeric(12,2) | CZK |
| `mortgage_amount` | numeric(12,2) | CZK |
| `target_monthly_rent` | numeric(12,2) | CZK |
| `size_m2` | numeric(5,1) | Flat size in m², e.g. 59.0 |
| `mortgage_rate` | numeric(5,4) | Annual rate, e.g. 0.0464 for 4.64% |
| `mortgage_term_years` | integer | Loan term, e.g. 30 |
| `mortgage_start_date` | date | When mortgage drawdown occurred |
| `mortgage_rate_fixed_until` | date | Triggers amber banner when ≤60 days away |
| `current_property_value` | numeric(12,2) | Manually updated market estimate, CZK |
| `current_property_value_updated_at` | timestamptz | When estimate was last set |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()`, updated on every change |

### Table: `entries`

All transactions — purchase, expenses, income — in one table, distinguished by `section`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `section` | text | enum-like: `'purchase' \| 'ongoing' \| 'income'` |
| `date` | date | Transaction date |
| `category` | text | One of the defined categories per section |
| `description` | text | Optional free text |
| `amount` | numeric(12,2) | CZK, always positive |
| `recurring` | boolean | default `false`. Used for ongoing/income only — purchase entries are always one-off. |
| `notes` | text | Optional |
| `tax_deductible` | boolean | default `false`. Included in tax export filter. |
| `invoice_url` | text | Vercel Blob URL, null if no file attached |
| `invoice_filename` | text | Original filename for display, null if no file attached |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |

**Indexes:**
- `(section, date desc)` — for grouped/sorted views
- `(section, recurring)` — for fast monthly-recurring sums

**Why one table not three?** All three sections share the same shape (date, category, amount, description, notes). Splitting them adds joins for the dashboard query without gain. Section is just a discriminator column.

**Why no enum type for section/category?** Postgres enums require migrations to alter. Text + app-level validation against constants is simpler for a project that's likely to evolve category lists.

---

## 3. Auth flow

```
Request → middleware.ts
            │
            ├─ has signed `flat_auth` cookie? → next()
            │
            └─ no/invalid cookie?
                  ├─ path = /login or /api/auth → next()
                  └─ otherwise → redirect to /login?next=<original-path>

POST /api/auth/login
  Body: { password: string }
  ├─ matches APP_PASSWORD?
  │    ├─ yes → set signed `flat_auth=ok` cookie → 200
  │    └─ no  → 401 { error: "Wrong password" }

POST /api/auth/logout
  → clear cookie → 200
```

**Cookie signing:** HMAC-SHA256 with `AUTH_SECRET`. Cookie value format: `ok.<hmac>`. Middleware recomputes hmac and compares constant-time.

**Why not NextAuth / Auth.js?** Overkill. One password, one user, no OAuth providers. ~30 lines of code vs an entire library.

---

## 4. Page-level architecture

### `/login`
Public. Server component renders form. Form is a client component that POSTs to `/api/auth/login`, redirects to `next` param on success.

### `/` (Dashboard)
Server component. Fetches all entries + meta in one call to `db.transaction(...)`. Passes to `<Dashboard />` client component for any interactive bits (none currently — could stay fully server-rendered).

### `/purchase`, `/expenses`, `/income`
Server component shell fetches relevant entries. `<EntrySection />` client component handles the add form, delete button, and category grouping. After mutation, calls `router.refresh()` to re-fetch server data.

### Why a mix of server + client?
- Server components: read-heavy pages (dashboard, lists) — fewer round trips, no client-side fetch waterfall.
- Client components: anywhere with `useState` (forms, toggles, dialogs).
- API routes: all mutations. Client components `fetch()` them, then `router.refresh()`.

---

## 5. Component inventory

### Layout
- `RootLayout` — fonts, global styles, html/body
- `AppLayout` — property header, tab nav, footer
- `<PropertyHeader />` — property name, chips (m², price, price/m², down payment), edit button, export buttons. Shown on every page.

### Dashboard
- `<Dashboard />` — orchestrates the dashboard tab
- `<RateBanner />` — amber notification shown when `mortgage_rate_fixed_until` ≤60 days away
- `<KpiCard />` — top row: invested, cash flow, yield
- `<MiniStat />` — second row: purchase total, expenses, income
- `<FinancingBreakdown />` — mortgage vs equity horizontal bar
- `<MortgageCard />` — monthly payment strip + dark property section + lavender interest section
- `<PropertyValueCard />` — purchased at / current estimate / gain; inline edit for estimate
- `<RecentActivity />` — last 8 transactions across sections

### Entry sections
- `<EntrySection section="purchase|ongoing|income" />` — header, totals, add form, grouped list
- `<EntryForm />` — controlled inputs for date/category/amount/description/notes/recurring/tax_deductible + invoice upload
- `<InvoiceUpload />` — dashed drop zone (empty state) / file preview (attached state); calls `POST /api/upload`
- `<EntryRow />` — single transaction line with badges (recurring, tax, invoice) and delete button
- `<CategoryGroup />` — entries grouped by category with subtotal header

### Meta + chrome
- `<MetaEditor />` — form for property name, prices, size_m2, mortgage params, target rent
- `<BackupButtons />` — JSON backup, CSV export, import file picker
- `<TabNav />` — four tabs

### Primitives (from shadcn/ui)
- Button, Input, Select, Label, Card, Dialog (for import confirmation), Badge (for pills)

---

## 6. Calculations module

`/lib/calculations.ts` — pure functions, no DB, no React.

```ts
type Entry = {
  section: Section; amount: number; recurring: boolean;
  date: string; tax_deductible: boolean; ...
};
type Meta = {
  purchasePrice: number; mortgageAmount: number; targetMonthlyRent: number;
  sizeM2: number; mortgageRate: number; mortgageTermYears: number;
  mortgageStartDate: string; mortgageRateFixedUntil: string;
  currentPropertyValue: number; ...
};

export function computeTotals(entries: Entry[], meta: Meta) {
  // ... existing totals, yields, cash flow ...
  const pricePerM2 = meta.sizeM2 > 0 ? meta.purchasePrice / meta.sizeM2 : 0;
  const appreciationCZK = meta.currentPropertyValue - meta.purchasePrice;
  const appreciationPct = meta.purchasePrice
    ? (appreciationCZK / meta.purchasePrice) * 100 : 0;

  return { purchaseTotal, ongoingTotal, incomeTotal, monthlyOngoing,
           monthlyIncome, netMonthly, annualNet, totalInvested,
           grossYield, netYield, pricePerM2, appreciationCZK, appreciationPct };
}

// Returns days remaining until rate resets; negative = already expired
export function daysUntilRateReset(mortgageRateFixedUntil: string): number
```

Mortgage amortisation lives in a separate `/lib/mortgage.ts` — pure functions with Vitest unit tests. See section 6a below.

---

## 6a. Mortgage module

`/lib/mortgage.ts` — pure functions, no DB, no React. Covered by Vitest unit tests.

```ts
type MortgageParams = {
  principal: number;    // loan amount in CZK, e.g. 3419100
  annualRate: number;   // e.g. 0.0464
  termYears: number;    // e.g. 30
  startDate: string;    // ISO date "YYYY-MM-DD"
};

// Monthly annuity payment: M = P × r(1+r)^n / ((1+r)^n − 1)
export function monthlyPayment(p: MortgageParams): number

// For a given payment number (1-based), return principal/interest split
export function paymentSplit(p: MortgageParams, monthNumber: number): {
  principal: number; interest: number; remainingBalance: number;
}

// Totals from month 1 to current month (based on startDate vs today)
export function totalsToDate(p: MortgageParams): {
  principalPaid: number; interestPaid: number; remainingBalance: number;
  monthsElapsed: number; totalProjectedInterest: number; payoffDate: string;
}
```

The `MortgageCard` component calls `totalsToDate()` + `monthlyPayment()` to populate both sections. No DB reads in this module.

---

## 7. Export / import

### JSON backup (`GET /api/export?format=json`)
Server reads all entries + meta, returns:
```json
{
  "version": 1,
  "exportedAt": "2026-05-13T10:00:00Z",
  "meta": { ... },
  "entries": [ ... ]
}
```
Response headers:
- `Content-Type: application/json`
- `Content-Disposition: attachment; filename="flat-finance-backup-2026-05-13.json"`

### CSV export (`GET /api/export?format=csv`)
Flattens entries to columns: Section, Date, Category, Description, Amount (CZK), Recurring, Tax Deductible, Invoice, Notes. UTF-8 with BOM (`\ufeff`) so Excel reads Czech characters correctly.

### Tax ZIP export (`GET /api/export?format=tax&year=YYYY&section=expenses|income|both`)
Returns `flat-tax-export-{year}.zip` containing:
- `entries.csv` \u2014 filtered entries for the given year/section with all fields
- `invoices/` \u2014 all attached invoice files for matching entries, named `{date}-{category}-{description}.pdf`

Uses `jszip` to build the archive in-memory. Invoice files are fetched from Vercel Blob and streamed into the ZIP.

### Import (`POST /api/import`)
Body: parsed JSON backup. Server validates structure (`version === 1`, has `meta` and `entries` arrays), then in a transaction:
1. Truncates `entries` table
2. Replaces `meta` row
3. Inserts all entries

Returns counts. Frontend shows confirmation dialog before calling — same UX as the artifact.

**Idempotency:** import always replaces. No merge logic. Backups are full snapshots, not deltas.

---

## 8. Error handling & validation

- **Input validation:** Zod schemas at API route boundaries. One schema per route.
- **DB errors:** caught in route handlers, return 500 with generic message. Log full error server-side (no secrets).
- **Client-side:** forms disable submit while pending, show inline error message on failure, never lose the user's input.
- **Network errors:** fetch wrapper with single retry on 5xx, fail visibly on 4xx.

---

## 9. Performance notes

This app will have maybe 500-2000 entries total over its lifetime. No pagination, no virtualisation needed. The dashboard query is a single `SELECT * FROM entries; SELECT * FROM meta;` — milliseconds.

Postgres connection pooling: use Neon's pooled connection (`DATABASE_URL`) for app queries. Use unpooled (`DATABASE_URL_UNPOOLED`) only for migrations.

---

## 10. Deployment checklist

**One-time setup:**
1. Create Neon project, get pooled + unpooled connection strings
2. Create Vercel project linked to GitHub repo
3. Add env vars in Vercel dashboard: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `APP_PASSWORD`, `AUTH_SECRET`
4. Push to `main` → first deploy runs `drizzle-kit migrate` then `next build`
5. (Optional) Add custom domain `flat.nextfemai.com` → Vercel gives CNAME target → add to Porkbun DNS

**Per-deploy:**
- `git push` → Vercel handles everything else
- Schema changes: `pnpm drizzle-kit generate` locally → commit migration → push

---

## 11. Open questions / future work

These are intentionally deferred. Capture here so they don't get lost.

- **Bank feed integration:** Could pull Raiffeisenbank transactions via Fio/Komerční-style API or via n8n + email parsing. Defer until app is actively used.
- **Full amortisation table:** A year-by-year schedule view (we currently show totals + current month split only).
- **Multi-property:** If a second flat ever happens, migrate to `properties` + `entries.property_id` model. Don't pre-build.
- **Preview deploys:** Separate Neon branch for Vercel preview environments to avoid polluting production data.

_(Mortgage amortisation calculator, invoice/receipt attachment, and tax export are now in scope and covered by the implementation plan at `docs/superpowers/plans/2026-05-13-flat-finance-tracker.md`.)_

---

## 12. Build order

See `docs/superpowers/plans/2026-05-13-flat-finance-tracker.md` for the full task-by-task implementation plan. High-level milestones:

1. **Foundation** — scaffold, Tailwind + Sage & Blush, DB schema (all columns), auth, constants + colour tokens
2. **Core UX** — mortgage lib + tests, calculations, API routes (entries/meta/upload), entry form with invoice upload + tax flag
3. **Dashboard & pages** — layout + property header, entry section pages, dashboard (KPI cards, mortgage card, property value card, rate banner, recent activity)
4. **Export & deploy** — tax ZIP export, JSON/CSV export, import, Vercel deploy
