# CLAUDE.md — Flat Finance Tracker

This file gives Claude Code the context it needs to work on this project. Read it before making changes.

---

## Build status

**App is live at flat-ostrava-finances.vercel.app. All features verified working locally — ready to push.**

### What's done
- Full Next.js 15 app scaffold with all pages, API routes, and dashboard
- Auth: single-password middleware, Web Crypto HMAC cookie (`lib/auth.ts`). Login uses `window.location.href` (not `router.push`) for hard redirect after auth so middleware sees the cookie immediately.
- DB: Drizzle schema + migrations applied to Neon. Three migrations exist:
  - `0000_opposite_killraven` — initial schema (entries, meta)
  - `0001_add_attachments` — attachments table
  - `0002_property_value_history` — property value history table (applied via Node script)
- All API routes: entries CRUD, meta, upload, export (JSON/CSV/tax-ZIP), import, attachments, blob-download proxy, property-value-history POST/PATCH/DELETE
- All UI: property header, tab nav, meta editor, entry forms, dashboard, entry edit, file attachments
- 8/8 mortgage calculator tests passing
- Tailwind v3 + PostCSS properly wired up (see CSS notes below)
- Mobile layout fixed for 375–430px viewports (iPhone SE → iPhone 16 Pro) — no left-side clipping on iOS Safari
- **Entry editing:** pencil icon on each row opens pre-filled form, saves via PATCH
- **File attachments:** multi-file upload per entry, stored in Vercel Blob (private). Edit form shows existing attachments with individual delete buttons. Blobs served via `/api/blob-download` proxy (token never exposed to browser).
- **Notes field:** textarea with placeholder, saves correctly end-to-end
- **Full redesign (2026-05-15):** palette replaced with Navy/Teal/Coral on Cream (#1E3A4A / #3D8070 / #D4684A on #F5F0E8); headings font changed to Playfair Display; dashboard restructured (2-hero KPI strip + support tier, mortgage card, property value card); income amounts in teal, expense amounts in coral throughout.
- **Period filter + chart:** dashboard KPIs scoped by period chips (3m / 6m / 12m / year / YTD / All-time); Monthly Income vs Expenses bar chart with custom tooltip (Income / Expenses / Net); `computeTotals` signature `(filteredEntries, allEntries, meta, monthCount, latestPropertyValue?)`.
- **Nav (2026-05-19):** 6 tabs — Dashboard, Expenses, Income, Inventární karta, Odpisy, Info. Purchase tab removed; `/purchase` redirects to `/expenses`. Desktop nav full-width horizontal bar; mobile hamburger in property header.
- **Property header:** edit button removed; hamburger in header triggers mobile dropdown nav; no chips.
- **Mortgage card:** info tooltip (ⓘ) shows rate/term/payoff date; large payment row; on mobile P/I breakdown shows as 2 stacked rows below the amount. Payoff date formatted DD.MM.YYYY.
- **Property value card:** gain hero (% + amount) — on mobile % sits next to arrow, amount on right; history rows — on mobile 2-line layout (date line 1, prices line 2); desktop 4-col grid unchanged.
- **Property value source of truth:** `property_value_history` table only. `meta.current_property_value` and `meta.current_property_value_updated_at` columns have been dropped from DB and schema. `computeTotals` accepts `latestPropertyValue?: number` as 5th param — caller passes `history[0]?.value`.
- **Date formatting:** `fmtDate()` in `lib/constants.ts` — all dates DD.MM.YYYY across the whole app.
- **KPI numbers font:** all large numbers use `font-sans` (DM Sans), not `font-display` (Playfair Display). Grand totals on Expenses/Income pages are navy, `font-sans`.
- **Monthly Ledger (dashboard):** `components/dashboard/monthly-ledger.tsx` — shows N months (grows 1 row/month from first entry date, caps at 6). Columns: Period / Income / Expenses / Net / Principal / Interest / Balance. P/I/Balance from amortisation calc; no mortgage columns if params not set.
- **Entry row redesign:** Line 1 = date (muted) + `tax` pill (coral) + `purchase` pill (navy, expenses page only). Line 2 = bold name + attachment count + expand arrow | amount + ↻ + edit/delete.
- **Expenses page:** `CombinedExpensesSection` — fetches both `purchase` and `ongoing` entries, grouped by month (cream header + coral subtotal). Add form has Ongoing/Purchase tag toggle at top. Purchase entries show a `purchase` badge on the row.
- **Income page:** `IncomeSection` — flat list grouped by month (cream header + teal subtotal). Add income button is teal.
- **Tax deductible:** available on all entry types including purchase costs.
- **Support tier (mobile):** centered layout, icons hidden.

### What's next
1. **Build out** Inventární karta, Odpisy, Info pages
2. **Optional:** add custom domain `flat.nextfemai.com` via Vercel Settings → Domains → add CNAME pointing to `cname.vercel-dns.com`

### Known notes
- `DATABASE_URL_UNPOOLED` currently points to the pooled Neon URL (has `-pooler` in hostname). `drizzle-kit migrate` uses this connection and may silently fail if it points to a different endpoint than the app. **Safe migration method:** use the Node script pattern that uses `DATABASE_URL` directly (see migration history below).
- `BLOB_READ_WRITE_TOKEN` is set in both `.env.local` and Vercel dashboard. The Blob store is **private access** — all files use `access: "private"` in `put()`. Downloads go through `/api/blob-download?url=...` which fetches with the server token.
- **`@vercel/blob` must stay on v2+** (currently v2.3.3). v0.x only typed `access: "public"` and had no real private store support — private blob uploads would silently fail. Do NOT downgrade.
- `drizzle.config.ts` loads `.env.local` via `dotenv`. Migrations must be run **locally** — NOT during Vercel build. The `vercel.json` `buildCommand: "next build"` ensures this.
- Do NOT add `drizzle-kit migrate` back to the build script or `vercel.json`. Run migrations manually before deploying schema changes.
- **When adding a new migration:** `pnpm db:migrate` may not apply it if `DATABASE_URL_UNPOOLED` is wrong. Fallback: apply SQL directly via Node — `node -e "require('dotenv').config({path:'.env.local'}); const {neon}=require('@neondatabase/serverless'); neon(process.env.DATABASE_URL)\`YOUR SQL\`.then(()=>console.log('done'))"`.

### Migration history
| File | Applied | Method |
|---|---|---|
| `0000_opposite_killraven.sql` | ✓ | `pnpm db:migrate` |
| `0001_add_attachments.sql` | ✓ | Node script via `DATABASE_URL` (drizzle-kit used wrong endpoint) |
| `0002_property_value_history.sql` | ✓ | Node script via `DATABASE_URL` |

### CSS / Tailwind setup (hard-won — do not revert)
- **Tailwind v3** (`tailwindcss@^3.4`) — NOT v4. shadcn/ui components were generated for v3 and are incompatible with v4.
- **`postcss.config.js`** — must be `.js` (CommonJS `module.exports`), NOT `.mjs`. Next.js silently ignores `.mjs` PostCSS configs.
- **`tailwind.config.ts`** — content paths + CSS variable color mappings (needed for `bg-primary`, `text-foreground`, etc.).
- **`globals.css`** — uses `@tailwind base/components/utilities` directives. CSS variables are HSL channel values (e.g. `--primary: 120 20% 30%`) not hex, so Tailwind opacity modifiers like `bg-primary/90` work.
- App-specific colours (Navy/Teal/Coral on Cream palette) are in `lib/colours.ts` as hex values and applied as inline styles — they do NOT go through Tailwind classes.

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
    /entries/route.ts           # GET, POST entries
    /entries/[id]/route.ts      # DELETE (cleans all blobs), PATCH entry
    /meta/route.ts              # GET, PATCH property meta
    /upload/route.ts            # POST (Vercel Blob, private), DELETE — single invoice upload
    /attachments/route.ts       # POST — upload file to Blob + insert attachments row
    /attachments/[id]/route.ts  # DELETE — remove blob + DB row
    /blob-download/route.ts     # GET ?url= — proxy for private blobs (serves with auth token)
    /export/route.ts            # GET → JSON/CSV/tax ZIP download
    /import/route.ts            # POST → restore from JSON
  /login/page.tsx               # Password entry
  /(app)
    /layout.tsx                 # Auth-protected layout, property header
    /page.tsx                   # Dashboard (default tab)
    /purchase/page.tsx          # Redirects to /expenses
    /expenses/page.tsx          # Fetches purchase + ongoing entries → CombinedExpensesSection
    /income/page.tsx            # Fetches income entries → IncomeSection
  /globals.css
  /layout.tsx                   # Root layout (fonts, metadata)
/components
  /ui/*                         # shadcn/ui primitives
  /entry-section.tsx            # Legacy grouped list (still used internally)
  /combined-expenses-section.tsx# Expenses page: purchase+ongoing merged, grouped by month
  /income-section.tsx           # Income page: flat list grouped by month
  /entry-form.tsx               # Add or edit entry (entry? prop = edit mode), multi-file upload
  /entry-row.tsx                # Row: line1=date+tags, line2=bold name+attachments | amount+actions
  /category-group.tsx           # Groups rows by category, passes onEdit through
  /invoice-upload.tsx           # Single invoice drop zone (legacy), links via /api/blob-download
  /meta-editor.tsx
  /property-header.tsx          # Global header + mobile hamburger nav
  /dashboard
    /dashboard.tsx
    /kpi-card.tsx
    /mini-stat.tsx
    /financing-breakdown.tsx
    /mortgage-card.tsx
    /monthly-ledger.tsx         # Month-by-month table: Income/Expenses/Net/Principal/Interest/Balance
    /property-value-card.tsx
    /recent-activity.tsx
    /rate-notification.tsx      # Amber banner, shown ≤60 days before rate reset
/db
  /schema.ts                    # Drizzle schema — entries, meta, attachments tables + types
  /index.ts                     # Drizzle client (neon-http)
  /migrations/                  # SQL migration files
/lib
  /constants.ts                 # Categories, CZK formatter, todayISO
  /colours.ts                   # Navy/Teal/Coral colour token object (not Tailwind classes)
  /auth.ts                      # Password check helper
  /mortgage.ts                  # Amortisation pure functions + Vitest tests
  /calculations.ts              # Yield, totals, pricePerM2, appreciation, daysUntilRateReset
/middleware.ts                  # Password gate
/drizzle.config.ts
/reference/flat_finance_tracker.jsx  # Original prototype — reference only, not imported
/.env.local                     # NEVER commit
/.env.example                   # Commit this
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

## Aesthetic / design language — Navy, Teal & Coral on Cream

The palette is **not** standard Tailwind colours. All colour values live in `/lib/colours.ts` and should be applied as inline styles — don't invent Tailwind class names for them.

| Token | Hex | Role |
|---|---|---|
| `bg` | `#F5F0E8` | Page background (cream) |
| `white` | `#FFFFFF` | Card background |
| `border` | `#E2D9CC` | All borders |
| `navy` | `#1E3A4A` | Primary text, structure, active tab |
| `navyMid` | `rgba(30,58,74,0.5)` | Secondary text, muted labels |
| `navyMuted` | `rgba(30,58,74,0.32)` | Placeholder, disabled |
| `navy08` | `rgba(30,58,74,0.08)` | Subtle chip background |
| `teal` | `#3D8070` | Income, positive numbers, equity, progress |
| `teal10` | `rgba(61,128,112,0.1)` | Teal tint bg |
| `coral` | `#D4684A` | Expenses, negative, Add entry button, warnings |
| `coral10` | `rgba(212,104,74,0.1)` | Coral tint bg |
| `coral20` | `rgba(212,104,74,0.18)` | Coral medium tint |

- **Cards:** `background: white`, `border: 1px solid #E2D9CC`, `border-radius: 12px`.
- **Input fields:** `background: #F5F0E8`, `border: 1px solid #E2D9CC`.
- **Display headings:** Playfair Display (variable `--font-fraunces`), weights 500/600.
- **Body:** DM Sans (variable `--font-inter`), 14px.
- **Money formatting:** `Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 })`. Always `tabular-nums` for amounts.
- **Income amounts:** teal `#3D8070`.
- **Expense amounts:** coral `#D4684A`.
- **Add entry button:** coral background, white text.
- **Active tab:** navy background `#1E3A4A`, cream text.
- **Tax deductible:** coral accent `#D4684A`, coral10 background.
- **Recurring indicator:** ↻ prefix, navy text weight.

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

- **Property equity** = `purchasePrice − mortgageAmount` (shown as top-left KPI; hidden if purchasePrice is 0)
- **Monthly recurring expenses** = sum of `ongoing.amount` where `recurring = true`
- **Monthly recurring income** = sum of `income.amount` where `recurring = true`
- **Net monthly cash flow** = monthlyIncome − monthlyExpenses
- **Annual net** = netMonthly × 12
- **Gross yield %** = (monthlyIncome × 12 / purchasePrice) × 100
- **Net yield %** = (annualNet / purchasePrice) × 100
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
Returns `{ ok: true }`. Deletes legacy `invoice_url` blob, then fetches and deletes all attachment blobs, then deletes the entry (DB cascade removes attachment rows).

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

### `POST /api/attachments`
Body: `multipart/form-data` with `file` and `entryId` fields. Uploads to Vercel Blob (private), inserts row in `attachments` table.
Returns `{ attachment: Attachment }`.

### `DELETE /api/attachments/[id]`
Deletes blob from Vercel Blob and removes DB row.
Returns `{ ok: true }`.

### `GET /api/blob-download?url=<encoded-blob-url>`
Server-side proxy for private Vercel Blob files. Fetches with `BLOB_READ_WRITE_TOKEN` and streams to client.
Use this for all `href` links to blob files — never link to blob URLs directly.

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
- Palette is Navy/Teal/Coral on Cream (custom hex values, not Tailwind colours) — do not revert to Sage & Blush or stone/purple prototype palette.
- Invoice attachment in v1 — `invoice_url`/`invoice_filename` on entries table (legacy single-file). New multi-file system uses the `attachments` table (FK → entries, ON DELETE CASCADE). Both coexist; new entries use `attachments`, old entries with `invoice_url` still display correctly via the blob-download proxy.
- Tax-deductible is a boolean flag per entry, not a category or free-form tag.
- Property appreciation is manual estimate only — Jana updates from Sreality.cz when she wants.
- Mortgage amortisation is auto-calculated from stored params in `meta` table — user does not manually enter monthly split.
- Rate reset notification: amber banner shown when `mortgage_rate_fixed_until` is ≤60 days away, dismissed when rate is updated.

---

## Reference prototype

The Claude artifact prototype is in `/reference/flat_finance_tracker.jsx`. It has the exact categories, dashboard layout, KPI logic, and entry form structure that production should match.

**Visual design exception:** The prototype uses a stone/purple palette. Production uses **Navy/Teal/Coral on Cream** as defined in the Aesthetic section above. Where the prototype conflicts on visuals, the Aesthetic section wins.

The spec is also the authority for new features not in the prototype: invoice upload, tax-deductible flag, mortgage amortisation card, property appreciation card, rate reset banner, and price-per-m² display.
