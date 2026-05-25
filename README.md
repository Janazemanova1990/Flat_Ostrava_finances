# Flat Finance Tracker

A personal web app for tracking all finances related to an Ostrava flat (Nádražní 2965/9) — purchase costs, ongoing expenses, rental income, and investment performance (yield, ROI, cash flow). Single-user, CZK-only.

🔗 Live at [flat-ostrava-finances.vercel.app](https://flat-ostrava-finances.vercel.app)

## Features

- **Dashboard** — period-filtered KPIs (3m / 6m / 12m / year / YTD / All-time), Monthly Income vs Expenses chart, mortgage card with amortisation, property value history with gain tracking, and a monthly ledger.
- **Expenses** — combined view of purchase and ongoing costs, grouped by month, with tax-deductible flagging.
- **Income** — rental income, grouped by month.
- **File attachments** — multi-file invoice/receipt upload per entry, stored privately in Vercel Blob.
- **Export / import** — JSON backup, CSV export, and a tax ZIP archive.
- **Mortgage calculator** — principal/interest breakdown, payoff date, and balance tracking.
- Mobile-friendly layout (375–430px viewports) with single-password authentication.

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **UI:** Tailwind CSS v3 + shadcn/ui, lucide-react icons, Recharts
- **Database:** Neon Postgres (serverless) via Drizzle ORM
- **File storage:** Vercel Blob (private access)
- **Validation:** Zod on all API inputs
- **Auth:** Single-password middleware (Web Crypto HMAC cookie)
- **Tests:** Vitest
- **Deployment:** Vercel

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm db:migrate              # apply migrations to your Neon database
pnpm dev                     # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection (pooled) |
| `DATABASE_URL_UNPOOLED` | Direct connection for migrations |
| `APP_PASSWORD` | Single password used to log in |
| `AUTH_SECRET` | Secret for signing the auth cookie |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for attachments |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Run migrations + production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Lint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm db:generate` | Generate a new Drizzle migration |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Project structure

```
/app
  /api          API routes (entries, meta, upload, attachments, export, import)
  /(app)        Auth-protected pages (dashboard, expenses, income)
  /login        Password entry
/components      UI components + shadcn/ui primitives
/db             Drizzle schema + migrations
/lib            Calculations, mortgage, auth, constants, colours
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full product spec and [`CLAUDE.md`](CLAUDE.md) for development notes.

## Notes

- **Currency:** CZK only — no multi-currency logic.
- **Migrations** are run locally, never during the Vercel build.
- `@vercel/blob` must stay on v2+ (private blob support).
- Tailwind is pinned to **v3** (shadcn/ui components are incompatible with v4).
