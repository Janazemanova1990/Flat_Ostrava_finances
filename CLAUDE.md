# CLAUDE.md — Flat Finance Tracker

This file gives Claude Code the context it needs to work on this project. Read it before making changes.

---

## Build status

**All code written and committed. Migration applied to Neon. Ready to deploy to Vercel.**

### What's done
- Full Next.js 15 app scaffold (Tasks 1–14 of the implementation plan)
- Auth: single-password middleware, Web Crypto HMAC cookie (`lib/auth.ts`)
- DB: Drizzle schema + migration applied to Neon (`db/schema.ts`, `db/migrations/`)
- All API routes: entries CRUD, meta, upload, export (JSON/CSV/tax-ZIP), import
- All UI: property header, tab nav, meta editor, entry forms, invoice upload, dashboard
- 8/8 mortgage calculator tests passing
- `next build` succeeds

### What's next (Task 15 — deploy)
1. Set up Vercel Blob storage → get `BLOB_READ_WRITE_TOKEN`
2. Create Vercel project, add all 5 env vars from `.env.local`
3. `git push` → Vercel auto-deploys
4. Optional: add domain `flat.nextfemai.com`

### Known notes
- `DATABASE_URL_UNPOOLED` should use the **non-pooled** Neon URL (no `-pooler` in hostname) — currently both point to pooled; works for now but migrations may be slow
- `BLOB_READ_WRITE_TOKEN` is empty — invoice upload will fail until Vercel Blob is set up
- `drizzle.config.ts` loads `.env.local` via `dotenv` (needed because drizzle-kit doesn't auto-load it)

---

## What this is

A personal web app for Jana to track all finances related to her Ostrava flat purchase (Nádražní 2965/9) and eventual rental: purchase costs, ongoing expenses, rental income, and investment performance (yield, ROI, cash flow). Single-user. Deployed to Vercel.

**This replaces a Claude artifact prototype** — the structure, categories, and dashboard logic from that prototype are the source of truth for product behaviour. See `ARCHITECTURE.md` for the full spec.

---

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui components
- **Icons:** lucide-react
- **Fonts:** Fraunces (display) + Inter (body), loaded via `next/font/google`
- **Database:** Neon Postgres (serverless)
- **ORM:** Drizzle ORM
- **File storage:** Vercel Blob (`@vercel/blob`) — invoice/receipt attachments
- **Auth:** Single-password middleware (env var `APP_PASSWORD`)
- **Deployment:** Vercel
- **Currency:** CZK only — no multi-currency logic anywhere
- **Validation:** Zod on all API inputs
- **ZIP export:** `jszip` for tax archive
- **Tests:** Vitest (mortgage lib only)

---

## Project structure

```
/app
  /api
    /entries/route.ts       # GET, POST entries
    /entries/[id]/route.ts  # DELETE, PATCH entry
    /meta/route.ts          # GET, PATCH property meta
    /upload/route.ts        # POST (Vercel Blob upload), DELETE (remove blob)
    /export/route.ts        # GET → JSON/CSV/tax ZIP download
    /import/route.ts        # POST → restore from JSON
  /login/page.tsx           # Password entry
  /(app)
    /layout.tsx             # Auth-protected layout, property header
    /page.tsx               # Dashboard (default tab)
    /purchase/page.tsx
    /expenses/page.tsx
    /income/page.tsx
  /globals.css
  /layout.tsx               # Root layout (fonts, metadata)
/components
  /ui/*                     # shadcn/ui primitives
  /entry-section.tsx        # Shared list+form for purchase/expenses/income
  /invoice-upload.tsx       # Dashed drop zone + file preview, calls /api/upload
  /meta-editor.tsx
  /property-header.tsx      # Global header: name, chips, edit button, export buttons
  /dashboard
    /kpi-cards.tsx
    /mini-stats.tsx
    /financing-breakdown.tsx
    /mortgage-card.tsx      # Dark property section + lavender interest section
    /property-value-card.tsx
    /recent-activity.tsx
    /rate-banner.tsx        # Amber banner, shown ≤60 days before rate reset
/db
  /schema.ts                # Drizzle schema
  /index.ts                 # Drizzle client
  /migrations/              # Generated migrations
/lib
  /constants.ts             # Categories, CZK formatter
  /colours.ts               # Sage & Blush colour token object (not Tailwind classes)
  /auth.ts                  # Password check helper
  /mortgage.ts              # Amortisation pure functions + Vitest tests
  /calculations.ts          # Yield, totals, pricePerM2, appreciation, daysUntilRateReset
/middleware.ts              # Password gate
/drizzle.config.ts
/.env.local                 # NEVER commit
/.env.example               # Commit this
```

---

## Key principles

1. **DEV = Mac / local Next.js. PROD = Vercel.** Same as Resource Tracker rule.
2. **Never commit `.env.local`.** `.gitignore` covers `node_modules/`, `.env*`, `*.db`, `.next/` from project start.
3. **Never `console.log` secrets.** No DATABASE_URL, no APP_PASSWORD, ever.
4. **CZK only.** Don't introduce currency conversion, multi-currency types, or locale logic for other currencies.
5. **All amounts stored as integers (haléře / smallest unit).** Or as `numeric(12,2)` in Postgres — pick one and stay consistent. Recommendation: `numeric(12,2)` in DB, plain JS numbers in app code, format on display.
6. **Server components by default.** Use client components (`"use client"`) only for forms, interactive dashboards, and anything with state.
7. **Drizzle for all DB access.** No raw SQL in route handlers unless absolutely necessary.
8. **shadcn/ui for primitives.** Don't reinvent buttons, inputs, dialogs.
9. **No `<form>` POST submissions.** Use client-side `fetch` to API routes — matches the artifact's interaction model.

---

## Aesthetic / design language — Sage & Blush

The palette is **not** standard Tailwind colours. All colour values live in `/lib/colours.ts` and should be applied as inline styles or CSS variables — don't invent Tailwind class names for them.

| Role | Hex |
|---|---|
| Page background | `#f4f7f4` |
| Background gradient (top-right, sage) | `rgba(134,179,134,0.15)` |
| Background gradient (bottom-left, blush) | `rgba(210,169,169,0.12)` |
| Card background | `white` |
| Card border | `#d4e0d4` |
| Primary text | `#2d3b2d` |
| Primary action (buttons, active tab) | `#3d5c3d` |
| Muted text / labels | `#8faa8f` |
| Eyebrow / secondary text | `#5f7a5f` |
| Income / positive | `#2d6a2d` |
| Tax deductible accent | `#8b4a4a` |
| Tax deductible bg | `#f5e8e8` |
| Mortgage dark section bg | `#1c1917` |
| Mortgage interest section bg | `#f5f3ff` |
| Mortgage interest section border | `#ddd6fe` |
| Mortgage interest accent | `#6d28d9` |
| Rate notification bg | `#fffbeb` |
| Rate notification border | `#fcd34d` |

- **Cards:** `background: white`, `border: 1px solid #d4e0d4`, `border-radius: 12px`.
- **Input fields:** `background: #f4f7f4`, same border.
- **Display headings:** Fraunces, medium weight.
- **Body:** Inter, 13–14px.
- **Money formatting:** `Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 })`. Always `tabular-nums` for amounts.
- **Recurring badge:** sage green pill (`↻ monthly`).
- **Tax badge:** rose pill (`⊛ tax`).
- **Invoice badge:** sage green pill (`📄 invoice`), clickable.

---

## Auth model (don't overthink it)

Single password stored in `APP_PASSWORD` env var. Middleware checks for a signed cookie `flat_auth=ok` (signed with `AUTH_SECRET`). If absent or invalid → redirect to `/login`. `/login` accepts password, sets cookie if correct, redirects to `/`.

That's it. No user table, no sessions table, no JWT library. Sign the cookie with `crypto.createHmac` from Node's stdlib.

**Cookie config:**
- `httpOnly: true`
- `secure: true` (in production)
- `sameSite: "lax"`
- `maxAge: 60 * 60 * 24 * 90` (90 days)

---

## Database conventions

- **Single owner.** No `user_id` columns — this is a single-user app. If multi-user is ever needed, that's a v2 migration.
- **Timestamps:** every table has `created_at` and `updated_at` (both `timestamp with time zone`, default `now()`).
- **IDs:** UUID v4 generated client-side or via Drizzle `$defaultFn`.
- **Soft delete:** not implemented. Hard delete is fine — backups via JSON export cover the "oops" case.
- **Migrations:** `pnpm drizzle-kit generate` → commit the migration → `pnpm drizzle-kit migrate` runs on deploy via a Vercel build step or manually.

---

## Categories (single source of truth)

Defined in `/lib/constants.ts`. Do NOT scatter these across files — import from there.

**Purchase categories** (8):
- Escrow deposit
- Mortgage drawdown
- Legal & notary
- Cadastral fees
- Property insurance
- Mortgage fees
- Renovation / furnishing
- Other one-off

**Ongoing expense categories** (11):
- Mortgage payment
- SVJ fees
- Utilities — electricity
- Utilities — gas
- Utilities — water
- Internet
- Property insurance
- Repairs & maintenance
- Property management
- Tax
- Other

**Income categories** (4):
- Rent
- Deposit received
- Reimbursement
- Other

If Jana wants to add or rename categories, do it in `constants.ts` only.

---

## Calculation rules

All derived values live in `/lib/calculations.ts`. The dashboard reads from these — never recompute in components.

- **Total invested** = `purchaseTotal + ongoingTotal - incomeTotal`
- **Monthly recurring expenses** = sum of `ongoing.amount` where `recurring = true`
- **Monthly recurring income** = sum of `income.amount` where `recurring = true`
- **Net monthly cash flow** = monthlyIncome − monthlyExpenses
- **Annual net** = netMonthly × 12
- **Gross yield %** = (monthlyIncome × 12 / purchasePrice) × 100
- **Net yield %** = (annualNet / purchasePrice) × 100
- **Equity invested** = `purchaseTotal − mortgageAmount + ongoingTotal − incomeTotal` (floor at 0 for display)
- **Price per m²** = `purchasePrice / sizeM2` (0 if sizeM2 = 0)
- **Appreciation (Kč)** = `currentPropertyValue − purchasePrice`
- **Appreciation (%)** = `appreciationCZK / purchasePrice × 100`
- **Days until rate reset** = `daysUntilRateReset(mortgageRateFixedUntil)` — used to show/hide amber banner at ≤60 days

If `purchasePrice` is 0, yield and price/m² calculations return 0 (don't divide by zero).

Mortgage amortisation lives in `/lib/mortgage.ts` (pure functions, no DB). Key functions: `monthlyPayment()`, `paymentSplit(monthNumber)`, `totalsToDate()`. Formula: standard annuity `M = P × r(1+r)^n / ((1+r)^n − 1)`.

---

## API contract

All routes return JSON. Errors: `{ error: string }` with appropriate status code.

### `GET /api/entries?section=purchase|ongoing|income`
Returns `{ entries: Entry[] }`.

### `POST /api/entries`
Body: `{ section, date, category, description, amount, recurring?, notes?, tax_deductible?, invoice_url?, invoice_filename? }`.
Returns `{ entry: Entry }`.

### `PATCH /api/entries/[id]`
Body: partial Entry.
Returns `{ entry: Entry }`.

### `DELETE /api/entries/[id]`
Returns `{ ok: true }`. Also deletes associated Vercel Blob file if `invoice_url` is set.

### `GET /api/meta`
Returns `{ meta: Meta }`.

### `PATCH /api/meta`
Body: partial Meta.
Returns `{ meta: Meta }`.

### `POST /api/upload`
Body: `multipart/form-data` with `file` field. Accepts PDF, JPG, PNG, max 10 MB.
Returns `{ url, filename, size }`. Stores in Vercel Blob.

### `DELETE /api/upload`
Body: `{ url }`. Deletes file from Vercel Blob.

### `GET /api/export?format=json|csv`
Returns file download with `Content-Disposition` header. CSV is BOM-prefixed for Excel compatibility.

### `GET /api/export?format=tax&year=YYYY&section=expenses|income|both`
Returns ZIP: `flat-tax-export-{year}.zip` containing `entries.csv` + `invoices/` folder with all attached files for matching entries.

### `POST /api/import`
Body: JSON backup file content. Replaces all data. Returns `{ ok: true, imported: { purchase, ongoing, income } }`.

---

## Environment variables

Required (set in Vercel dashboard + locally in `.env.local`):

```
DATABASE_URL=postgresql://...          # Neon connection string (pooled)
DATABASE_URL_UNPOOLED=postgresql://... # Neon direct connection (for migrations)
APP_PASSWORD=<chosen by Jana>
AUTH_SECRET=<long random string>       # For signing the auth cookie
BLOB_READ_WRITE_TOKEN=<vercel blob>    # Vercel Blob — invoice/receipt storage
```

Commit `.env.example` with placeholders. Never commit real values.

---

## Deployment workflow

1. Push to `main` → Vercel auto-deploys.
2. Migrations run via `pnpm drizzle-kit migrate` before build (configured in `package.json` `build` script: `drizzle-kit migrate && next build`).
3. Vercel env vars set once in dashboard, persist across deploys.
4. Preview deployments (PRs / branches) use the same database — be careful, or set up a separate Neon branch for previews later.

---

## What's out of scope (don't build these yet)

- Multi-currency
- Multiple properties
- Multi-user / sharing
- Full mortgage amortisation schedule table (we calculate totals + current month split, not a full year-by-year table)
- Bank feed integration (n8n can come later)
- Mobile app
- Email reports
- Charts beyond what's in the dashboard
- Free-form tags (categories + tax_deductible flag cover all filtering needs)
- Auto property appreciation rate (manual estimate only)

---

## What's already decided (don't re-litigate)

- Vercel hosting, not the Hostinger VPS. The VPS is for n8n, Resource Tracker, and NextFem AI — this app stays separate.
- Postgres on Neon, not SQLite. Better backups, better for serverless.
- Single password, not OAuth or magic links.
- CZK only.
- No user accounts table.
- Palette is Sage & Blush (custom hex values, not Tailwind colours) — do not revert to stone/purple prototype palette.
- Invoice attachment in v1, not deferred — affects DB schema (`invoice_url`, `invoice_filename` on entries table).
- Tax-deductible is a boolean flag per entry, not a category or free-form tag.
- Property appreciation is manual estimate only — Jana updates from Sreality.cz when she wants.
- Mortgage amortisation is auto-calculated from stored params in `meta` table — user does not manually enter monthly split.
- Rate reset notification: amber banner shown when `mortgage_rate_fixed_until` is ≤60 days away, dismissed when rate is updated.

---

## Reference prototype

The Claude artifact prototype is in `/reference/flat_finance_tracker.jsx`. It has the exact categories, dashboard layout, KPI logic, and entry form structure that production should match.

**Visual design exception:** The prototype uses a stone/purple palette. Production uses **Sage & Blush** as defined in the Aesthetic section above and the full design spec at `docs/superpowers/specs/2026-05-13-flat-finance-tracker-design.md`. Where the spec and prototype conflict on visuals, the spec wins.

The spec is also the authority for new features not in the prototype: invoice upload, tax-deductible flag, mortgage amortisation card, property appreciation card, rate reset banner, and price-per-m² display.
