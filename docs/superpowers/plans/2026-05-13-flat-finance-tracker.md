# Flat Finance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 15 web app for tracking flat purchase finances — purchase costs, ongoing expenses, rental income, mortgage payoff, property appreciation, invoice attachments, and tax exports.

**Architecture:** Server components for data-fetching pages, client components for forms and interactive dashboard elements. All mutations go through API routes; client components call `fetch()` then `router.refresh()`. Postgres on Neon via Drizzle ORM, file storage via Vercel Blob.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, shadcn/ui, Drizzle ORM, Neon Postgres, Vercel Blob, `@vercel/blob`, `jszip`, Zod, Fraunces + Inter fonts.

---

## Milestone 1 — Foundation (Tasks 1–5)
Working auth, database, and empty entry sections. Data persists to Postgres.

## Milestone 2 — Core UX (Tasks 6–9)
Full entry forms with invoice upload + tax flag. Dashboard with all KPIs.

## Milestone 3 — New Features (Tasks 10–12)
Mortgage calculator, property appreciation, tax ZIP export.

## Milestone 4 — Polish & Deploy (Task 13)
Empty states, rate notification, deploy checklist.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `drizzle.config.ts`
- Create: `components.json` (shadcn config)

- [ ] **Step 1: Scaffold Next.js 15 app with TypeScript and Tailwind**

```bash
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: Install core dependencies**

```bash
pnpm add drizzle-orm @neondatabase/serverless drizzle-zod zod \
  @vercel/blob jszip \
  lucide-react
pnpm add -D drizzle-kit @types/jszip
```

- [ ] **Step 3: Install and init shadcn/ui**

```bash
pnpx shadcn@latest init
# Choose: Default style, zinc base color, CSS variables yes
pnpx shadcn@latest add button input select label card dialog badge
```

- [ ] **Step 4: Install fonts package (already in Next.js, just verify)**

Fraunces and Inter load via `next/font/google` — no extra install needed.

- [ ] **Step 5: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
```

- [ ] **Step 6: Create `.env.example`**

```bash
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
APP_PASSWORD=
AUTH_SECRET=
BLOB_READ_WRITE_TOKEN=
```

- [ ] **Step 7: Create `.gitignore`**

```
node_modules/
.env*
.next/
*.db
.DS_Store
```

- [ ] **Step 8: Update `next.config.ts` to allow Vercel Blob image domains**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
```

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 15 app with Tailwind, shadcn/ui, Drizzle, Vercel Blob"
```

---

## Task 2: Design tokens and global styles

**Files:**
- Create: `lib/colours.ts`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Create `lib/colours.ts` — Sage & Blush palette**

```ts
export const colours = {
  bg: "#f4f7f4",
  bgGradientSage: "rgba(134,179,134,0.15)",
  bgGradientBlush: "rgba(210,169,169,0.12)",
  cardBorder: "#d4e0d4",
  text: "#2d3b2d",
  primary: "#3d5c3d",
  muted: "#8faa8f",
  eyebrow: "#5f7a5f",
  income: "#2d6a2d",
  taxAccent: "#8b4a4a",
  taxBg: "#f5e8e8",
  mortgageDark: "#1c1917",
  mortgageInterestBg: "#f5f3ff",
  mortgageInterestBorder: "#ddd6fe",
  mortgageInterestAccent: "#6d28d9",
  notificationBg: "#fffbeb",
  notificationBorder: "#fcd34d",
} as const;
```

- [ ] **Step 2: Update `app/globals.css`**

```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

:root {
  --background: #f4f7f4;
  --foreground: #2d3b2d;
  --card: #ffffff;
  --card-border: #d4e0d4;
  --primary: #3d5c3d;
  --primary-foreground: #f4f7f4;
  --muted: #8faa8f;
}

body {
  background-color: var(--background);
  background-image:
    radial-gradient(circle at 100% 0%, rgba(134,179,134,0.15) 0%, transparent 50%),
    radial-gradient(circle at 0% 100%, rgba(210,169,169,0.12) 0%, transparent 50%);
  background-attachment: fixed;
  color: var(--foreground);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
}

.font-display {
  font-family: 'Fraunces', Georgia, serif;
  font-variation-settings: "opsz" 144;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/colours.ts app/globals.css tailwind.config.ts
git commit -m "feat: add Sage & Blush design tokens and global styles"
```

---

## Task 3: Database schema and first migration

**Files:**
- Create: `db/schema.ts`
- Create: `db/index.ts`
- Create: `db/migrations/` (generated)

- [ ] **Step 1: Create `db/schema.ts`**

```ts
import { pgTable, text, boolean, numeric, integer, date, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const meta = pgTable("meta", {
  id: integer("id").primaryKey().default(1),
  propertyName: text("property_name").notNull().default("Ostrava — Nádražní 2965/9"),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
  mortgageAmount: numeric("mortgage_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  targetMonthlyRent: numeric("target_monthly_rent", { precision: 12, scale: 2 }).notNull().default("0"),
  sizeM2: numeric("size_m2", { precision: 5, scale: 1 }).notNull().default("0"),
  mortgageRate: numeric("mortgage_rate", { precision: 5, scale: 4 }).notNull().default("0"),
  mortgageTermYears: integer("mortgage_term_years").notNull().default(30),
  mortgageStartDate: date("mortgage_start_date"),
  mortgageRateFixedUntil: date("mortgage_rate_fixed_until"),
  currentPropertyValue: numeric("current_property_value", { precision: 12, scale: 2 }),
  currentPropertyValueUpdatedAt: timestamp("current_property_value_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  section: text("section").notNull(), // 'purchase' | 'ongoing' | 'income'
  date: date("date").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  recurring: boolean("recurring").notNull().default(false),
  notes: text("notes"),
  taxDeductible: boolean("tax_deductible").notNull().default(false),
  invoiceUrl: text("invoice_url"),
  invoiceFilename: text("invoice_filename"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type Meta = typeof meta.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
```

- [ ] **Step 2: Create `db/index.ts`**

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 3: Generate migration**

```bash
pnpm drizzle-kit generate
```

Expected: creates `db/migrations/0000_initial.sql`

- [ ] **Step 4: Update `package.json` build script to run migrations**

```json
{
  "scripts": {
    "build": "drizzle-kit migrate && next build",
    "db:migrate": "drizzle-kit migrate",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [ ] **Step 5: Run migration locally (requires DATABASE_URL_UNPOOLED in .env.local)**

```bash
pnpm db:migrate
```

Expected: "Migration applied successfully"

- [ ] **Step 6: Commit**

```bash
git add db/ drizzle.config.ts package.json
git commit -m "feat: add Drizzle schema with meta + entries tables, run first migration"
```

---

## Task 4: Auth — middleware, login, cookie

**Files:**
- Create: `lib/auth.ts`
- Create: `middleware.ts`
- Create: `app/login/page.tsx`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```ts
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "flat_auth";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function sign(value: string): string {
  const secret = process.env.AUTH_SECRET!;
  const hmac = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): boolean {
  const [value, hmac] = signed.split(".");
  if (!value || !hmac) return false;
  const expected = createHmac("sha256", process.env.AUTH_SECRET!).update(value).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function makeAuthCookie(): string {
  const signed = sign("ok");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${signed}; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}; Path=/${secure}`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}

export function isValidCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  return verify(match[1]);
}
```

- [ ] **Step 2: Create `middleware.ts`**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidCookie } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = request.headers.get("cookie");
  if (!isValidCookie(cookie)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 3: Create `app/api/auth/login/route.ts`**

```ts
import { NextResponse } from "next/server";
import { makeAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true }, {
    headers: { "Set-Cookie": makeAuthCookie() },
  });
}
```

- [ ] **Step 4: Create `app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  return NextResponse.json({ ok: true }, {
    headers: { "Set-Cookie": clearAuthCookie() },
  });
}
```

- [ ] **Step 5: Create `app/login/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(params.get("next") ?? "/");
    } else {
      setError("Wrong password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f4f7f4" }}>
      <div className="bg-white border border-[#d4e0d4] rounded-xl p-8 w-full max-w-sm shadow-sm">
        <div className="text-xs uppercase tracking-widest text-[#8faa8f] mb-2">🏠 Property Finance</div>
        <h1 className="font-display text-2xl font-medium text-[#2d3b2d] mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]"
          />
          {error && <p className="text-sm text-[#8b4a4a]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3d5c3d] text-[#f4f7f4] rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify auth works end-to-end**

```bash
pnpm dev
```

Open http://localhost:3000 — should redirect to /login. Enter wrong password → "Wrong password". Enter correct password → redirects to /.

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts middleware.ts app/login/ app/api/auth/
git commit -m "feat: add single-password auth with HMAC-signed cookie"
```

---

## Task 5: Constants and CZK formatter

**Files:**
- Create: `lib/constants.ts`

- [ ] **Step 1: Create `lib/constants.ts`**

```ts
export const PURCHASE_CATEGORIES = [
  "Escrow deposit",
  "Mortgage drawdown",
  "Legal & notary",
  "Cadastral fees",
  "Property insurance",
  "Mortgage fees",
  "Renovation / furnishing",
  "Other one-off",
] as const;

export const ONGOING_CATEGORIES = [
  "Mortgage payment",
  "SVJ fees",
  "Utilities — electricity",
  "Utilities — gas",
  "Utilities — water",
  "Internet",
  "Property insurance",
  "Repairs & maintenance",
  "Property management",
  "Tax",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Rent",
  "Deposit received",
  "Reimbursement",
  "Other",
] as const;

export type Section = "purchase" | "ongoing" | "income";

export const CATEGORIES: Record<Section, readonly string[]> = {
  purchase: PURCHASE_CATEGORIES,
  ongoing: ONGOING_CATEGORIES,
  income: INCOME_CATEGORIES,
};

export const fmtCZK = (n: number | string | null | undefined): string =>
  new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const todayISO = (): string => new Date().toISOString().slice(0, 10);
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add categories, CZK formatter, and Section type"
```

---

## Task 6: Mortgage calculator lib

**Files:**
- Create: `lib/mortgage.ts`
- Create: `lib/mortgage.test.ts`

- [ ] **Step 1: Install test runner**

```bash
pnpm add -D vitest @vitest/ui
```

Add to `package.json`:
```json
{ "scripts": { "test": "vitest run", "test:ui": "vitest --ui" } }
```

Add `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 2: Write failing tests in `lib/mortgage.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { monthlyPayment, paymentSplit, totalsToDate } from "./mortgage";

const params = {
  principal: 3_419_100,
  annualRate: 0.0464,
  termYears: 30,
  startDate: "2026-05-01",
};

describe("monthlyPayment", () => {
  it("returns correct annuity payment", () => {
    const m = monthlyPayment(params);
    expect(m).toBeCloseTo(17618, 0);
  });

  it("handles zero rate (flat repayment)", () => {
    const m = monthlyPayment({ ...params, annualRate: 0 });
    expect(m).toBeCloseTo(params.principal / (params.termYears * 12), 2);
  });
});

describe("paymentSplit", () => {
  it("month 1: interest = principal * monthly_rate", () => {
    const split = paymentSplit(params, 1);
    const expectedInterest = params.principal * (params.annualRate / 12);
    expect(split.interest).toBeCloseTo(expectedInterest, 0);
  });

  it("month 1: principal + interest = monthly payment", () => {
    const split = paymentSplit(params, 1);
    const m = monthlyPayment(params);
    expect(split.principal + split.interest).toBeCloseTo(m, 0);
  });

  it("remaining balance decreases each month", () => {
    const m1 = paymentSplit(params, 1);
    const m2 = paymentSplit(params, 2);
    expect(m2.remainingBalance).toBeLessThan(m1.remainingBalance);
  });

  it("final month balance is ~0", () => {
    const final = paymentSplit(params, params.termYears * 12);
    expect(final.remainingBalance).toBeCloseTo(0, 0);
  });
});

describe("totalsToDate", () => {
  it("returns zero totals if mortgage hasn't started yet", () => {
    const future = { ...params, startDate: "2099-01-01" };
    const t = totalsToDate(future);
    expect(t.principalPaid).toBe(0);
    expect(t.interestPaid).toBe(0);
    expect(t.monthsElapsed).toBe(0);
  });

  it("totalProjectedInterest = total payments - principal", () => {
    const t = totalsToDate(params);
    const totalPaid = monthlyPayment(params) * params.termYears * 12;
    expect(t.totalProjectedInterest).toBeCloseTo(totalPaid - params.principal, -3);
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
pnpm test
```

Expected: all tests fail with "Cannot find module './mortgage'"

- [ ] **Step 4: Create `lib/mortgage.ts`**

```ts
export type MortgageParams = {
  principal: number;
  annualRate: number;
  termYears: number;
  startDate: string;
};

export function monthlyPayment({ principal, annualRate, termYears }: MortgageParams): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function paymentSplit(
  params: MortgageParams,
  monthNumber: number
): { principal: number; interest: number; remainingBalance: number } {
  const { principal, annualRate, termYears } = params;
  const r = annualRate / 12;
  const n = termYears * 12;
  const M = monthlyPayment(params);

  // Remaining balance before this payment using closed-form
  const k = monthNumber - 1;
  const factor = Math.pow(1 + r, n);
  const factorK = Math.pow(1 + r, k);
  const balanceBefore = r === 0
    ? principal - k * M
    : principal * (factor - factorK) / (factor - 1);

  const interest = round2(balanceBefore * r);
  const principalPaid = round2(M - interest);
  const remainingBalance = Math.max(0, round2(balanceBefore - principalPaid));

  return { principal: principalPaid, interest, remainingBalance };
}

export function totalsToDate(params: MortgageParams): {
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  monthsElapsed: number;
  totalProjectedInterest: number;
  payoffDate: string;
} {
  const { principal, annualRate, termYears, startDate } = params;
  const n = termYears * 12;
  const M = monthlyPayment(params);
  const totalProjectedInterest = Math.round(M * n - principal);

  const start = new Date(startDate);
  const now = new Date();
  const monthsElapsed = Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth())
  );

  // Closed-form principal paid after k payments
  const r = annualRate / 12;
  const k = Math.min(monthsElapsed, n);
  const factor = Math.pow(1 + r, n);
  const factorK = Math.pow(1 + r, k);
  const principalPaid = r === 0
    ? k * M
    : principal * (factorK - 1) / (factor - 1);
  const interestPaid = k * M - principalPaid;
  const remainingBalance = Math.max(0, principal - principalPaid);

  const payoffDate = new Date(start);
  payoffDate.setMonth(payoffDate.getMonth() + n);

  return {
    principalPaid: Math.round(principalPaid),
    interestPaid: Math.round(interestPaid),
    remainingBalance: Math.round(remainingBalance),
    monthsElapsed,
    totalProjectedInterest,
    payoffDate: payoffDate.toISOString().slice(0, 7),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
pnpm test
```

Expected: all 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/mortgage.ts lib/mortgage.test.ts vitest.config.ts
git commit -m "feat: add mortgage amortisation calculator with tests"
```

---

## Task 7: Calculations lib

**Files:**
- Create: `lib/calculations.ts`

- [ ] **Step 1: Create `lib/calculations.ts`**

```ts
import type { Entry, Meta } from "@/db/schema";

export type Totals = {
  purchaseTotal: number;
  ongoingTotal: number;
  incomeTotal: number;
  monthlyOngoing: number;
  monthlyIncome: number;
  netMonthly: number;
  annualNet: number;
  totalInvested: number;
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
  const totalInvested = purchaseTotal + ongoingTotal - incomeTotal;

  const purchasePrice = Number(meta.purchasePrice);
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
    totalInvested, grossYield, netYield,
    pricePerM2, appreciationCZK, appreciationPct,
  };
}

export function daysUntilRateReset(fixedUntil: string | null): number | null {
  if (!fixedUntil) return null;
  const diff = new Date(fixedUntil).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/calculations.ts
git commit -m "feat: add computeTotals with appreciation and price/m² calculations"
```

---

## Task 8: API routes — meta and entries

**Files:**
- Create: `app/api/meta/route.ts`
- Create: `app/api/entries/route.ts`
- Create: `app/api/entries/[id]/route.ts`

- [ ] **Step 1: Create `app/api/meta/route.ts`**

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { meta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const MetaPatch = z.object({
  propertyName: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  mortgageAmount: z.coerce.number().optional(),
  targetMonthlyRent: z.coerce.number().optional(),
  sizeM2: z.coerce.number().optional(),
  mortgageRate: z.coerce.number().optional(),
  mortgageTermYears: z.coerce.number().int().optional(),
  mortgageStartDate: z.string().nullable().optional(),
  mortgageRateFixedUntil: z.string().nullable().optional(),
  currentPropertyValue: z.coerce.number().nullable().optional(),
});

export async function GET() {
  let row = await db.query.meta.findFirst();
  if (!row) {
    [row] = await db.insert(meta).values({ id: 1 }).returning();
  }
  return NextResponse.json({ meta: row });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = MetaPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.currentPropertyValue != null) {
    updates.currentPropertyValueUpdatedAt = new Date();
  }

  const [row] = await db.update(meta).set(updates).where(eq(meta.id, 1)).returning();
  return NextResponse.json({ meta: row });
}
```

- [ ] **Step 2: Create `app/api/entries/route.ts`**

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const EntryCreate = z.object({
  section: z.enum(["purchase", "ongoing", "income"]),
  date: z.string(),
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.coerce.number().positive(),
  recurring: z.boolean().optional().default(false),
  notes: z.string().optional(),
  taxDeductible: z.boolean().optional().default(false),
  invoiceUrl: z.string().url().nullable().optional(),
  invoiceFilename: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  const rows = section
    ? await db.select().from(entries).where(eq(entries.section, section)).orderBy(desc(entries.date))
    : await db.select().from(entries).orderBy(desc(entries.date));

  return NextResponse.json({ entries: rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = EntryCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const [entry] = await db.insert(entries).values(parsed.data).returning();
  return NextResponse.json({ entry }, { status: 201 });
}
```

- [ ] **Step 3: Create `app/api/entries/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { del } from "@vercel/blob";

const EntryPatch = z.object({
  date: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  recurring: z.boolean().optional(),
  notes: z.string().optional(),
  taxDeductible: z.boolean().optional(),
  invoiceUrl: z.string().url().nullable().optional(),
  invoiceFilename: z.string().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = EntryPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const [entry] = await db.update(entries)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(entries.id, id))
    .returning();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry] = await db.select().from(entries).where(eq(entries.id, id));
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete invoice from Blob if attached
  if (entry.invoiceUrl) {
    await del(entry.invoiceUrl).catch(() => null);
  }

  await db.delete(entries).where(eq(entries.id, id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Test API routes manually**

```bash
pnpm dev
# In another terminal:
curl http://localhost:3000/api/meta
# Expected: { "meta": { "id": 1, "propertyName": "Ostrava — Nádražní 2965/9", ... } }

curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{"section":"purchase","date":"2026-05-13","category":"Escrow deposit","amount":379900}'
# Expected: { "entry": { "id": "...", ... } }
```

- [ ] **Step 5: Commit**

```bash
git add app/api/meta/ app/api/entries/
git commit -m "feat: add meta and entries API routes with Zod validation"
```

---

## Task 9: Invoice upload API route

**Files:**
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: Create `app/api/upload/route.ts`**

```ts
import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPG, PNG allowed" }, { status: 400 });
  }

  const blob = await put(`invoices/${Date.now()}-${file.name}`, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({
    url: blob.url,
    filename: file.name,
    size: file.size,
  });
}

export async function DELETE(request: Request) {
  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  await del(url);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/upload/
git commit -m "feat: add invoice upload/delete API route via Vercel Blob"
```

---

## Task 10: Root layout and app shell

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `components/property-header.tsx`
- Create: `components/tab-nav.tsx`
- Create: `components/meta-editor.tsx`

- [ ] **Step 1: Update `app/layout.tsx` with fonts**

```tsx
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Flat Finance — Ostrava",
  description: "Property finance tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create `components/tab-nav.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, KeyRound, Receipt, ArrowDownCircle } from "lucide-react";

const tabs = [
  { href: "/", label: "Dashboard", icon: TrendingUp },
  { href: "/purchase", label: "Purchase", icon: KeyRound },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: ArrowDownCircle },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 mb-8 bg-white p-1 rounded-xl border border-[#d4e0d4] w-fit">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              active
                ? "bg-[#3d5c3d] text-[#f4f7f4]"
                : "text-[#5f7a5f] hover:text-[#2d3b2d]"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Create `components/meta-editor.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import type { Meta } from "@/db/schema";

export function MetaEditor({ meta, onClose }: { meta: Meta; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    propertyName: meta.propertyName,
    purchasePrice: String(meta.purchasePrice),
    mortgageAmount: String(meta.mortgageAmount),
    targetMonthlyRent: String(meta.targetMonthlyRent),
    sizeM2: String(meta.sizeM2),
    mortgageRate: String(Number(meta.mortgageRate) * 100), // display as percentage
    mortgageTermYears: String(meta.mortgageTermYears),
    mortgageStartDate: meta.mortgageStartDate ?? "",
    mortgageRateFixedUntil: meta.mortgageRateFixedUntil ?? "",
    currentPropertyValue: meta.currentPropertyValue ? String(meta.currentPropertyValue) : "",
  });

  async function save() {
    await fetch("/api/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        mortgageRate: Number(draft.mortgageRate) / 100, // store as decimal
      }),
    });
    router.refresh();
    onClose();
  }

  const field = (label: string, key: keyof typeof draft, type = "text") => (
    <label className="block text-xs text-[#5f7a5f] uppercase tracking-wider font-semibold">
      {label}
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        className="mt-1 block w-full bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]"
      />
    </label>
  );

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2">{field("Property name", "propertyName")}</div>
        {field("Purchase price (Kč)", "purchasePrice", "number")}
        {field("Mortgage amount (Kč)", "mortgageAmount", "number")}
        {field("Flat size (m²)", "sizeM2", "number")}
        {field("Target monthly rent (Kč)", "targetMonthlyRent", "number")}
        {field("Interest rate (%)", "mortgageRate", "number")}
        {field("Mortgage term (years)", "mortgageTermYears", "number")}
        {field("Mortgage start date", "mortgageStartDate", "date")}
        {field("Fixed rate until", "mortgageRateFixedUntil", "date")}
        <div className="col-span-2">{field("Current property estimate (Kč)", "currentPropertyValue", "number")}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium">
          <Check size={14} /> Save
        </button>
        <button onClick={onClose} className="text-[#8faa8f] hover:text-[#2d3b2d] px-3 py-2 rounded-lg">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/property-header.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Home, Pencil, Download, Upload } from "lucide-react";
import { MetaEditor } from "@/components/meta-editor";
import { fmtCZK } from "@/lib/constants";
import type { Meta } from "@/db/schema";

export function PropertyHeader({ meta }: { meta: Meta }) {
  const [editing, setEditing] = useState(false);
  const purchasePrice = Number(meta.purchasePrice);
  const sizeM2 = Number(meta.sizeM2);
  const mortgageAmount = Number(meta.mortgageAmount);
  const downPayment = purchasePrice - mortgageAmount;
  const downPct = purchasePrice > 0 ? Math.round((downPayment / purchasePrice) * 100) : 0;
  const pricePerM2 = sizeM2 > 0 ? Math.round(purchasePrice / sizeM2) : 0;

  return (
    <header className="mb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[#8faa8f] text-xs tracking-widest uppercase mb-2">
            <Home size={12} />
            <span>Property Finance</span>
          </div>
          {editing ? (
            <MetaEditor meta={meta} onClose={() => setEditing(false)} />
          ) : (
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-[#2d3b2d]">
                {meta.propertyName}
              </h1>
              <div className="flex gap-2 flex-wrap mt-3">
                {sizeM2 > 0 && (
                  <span className="bg-[#e8f0e8] text-[#3d5c3d] text-xs font-medium px-3 py-1 rounded-full">
                    {sizeM2} m²
                  </span>
                )}
                {purchasePrice > 0 && (
                  <span className="bg-[#f4f7f4] text-[#5f7a5f] text-xs font-medium px-3 py-1 rounded-full border border-[#d4e0d4]">
                    {fmtCZK(purchasePrice)}
                  </span>
                )}
                {pricePerM2 > 0 && (
                  <span className="bg-[#ede9fe] text-[#5b21b6] text-xs font-medium px-3 py-1 rounded-full">
                    {fmtCZK(pricePerM2)} / m²
                  </span>
                )}
                {downPayment > 0 && (
                  <span className="bg-[#1c1917] text-[#fafaf9] text-xs font-medium px-3 py-1 rounded-full">
                    {downPct}% down · {fmtCZK(downPayment)} equity
                  </span>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="text-[#8faa8f] text-xs hover:text-[#2d3b2d] flex items-center gap-1 px-2"
                >
                  <Pencil size={11} /> edit
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap items-start">
          <a href="/api/export?format=json" className="flex items-center gap-1.5 bg-white border border-[#d4e0d4] text-[#5f7a5f] text-xs font-medium px-3 py-1.5 rounded-lg hover:border-[#3d5c3d]">
            <Download size={12} /> Backup JSON
          </a>
          <a href="/api/export?format=csv" className="flex items-center gap-1.5 bg-white border border-[#d4e0d4] text-[#5f7a5f] text-xs font-medium px-3 py-1.5 rounded-lg hover:border-[#3d5c3d]">
            <Download size={12} /> CSV
          </a>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create `app/(app)/layout.tsx`**

```tsx
import { db } from "@/db";
import { PropertyHeader } from "@/components/property-header";
import { TabNav } from "@/components/tab-nav";
import { meta } from "@/db/schema";

async function getMeta() {
  let row = await db.query.meta.findFirst();
  if (!row) {
    const [inserted] = await db.insert(meta).values({ id: 1 }).returning();
    row = inserted;
  }
  return row;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const metaRow = await getMeta();
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PropertyHeader meta={metaRow} />
      <TabNav />
      <main>{children}</main>
      <footer className="mt-16 pt-6 border-t border-[#d4e0d4] text-xs text-[#8faa8f] text-center">
        Data saved automatically · all amounts in CZK
      </footer>
    </div>
  );
}
```

- [ ] **Step 6: Verify layout renders**

```bash
pnpm dev
```

Open http://localhost:3000 — should show property header with tab nav. Click tabs — URL changes.

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/(app)/layout.tsx components/property-header.tsx components/tab-nav.tsx components/meta-editor.tsx
git commit -m "feat: add app layout, property header with chips, tab nav, meta editor"
```

---

## Task 11: Invoice upload component and entry form

**Files:**
- Create: `components/invoice-upload.tsx`
- Create: `components/entry-form.tsx`
- Create: `components/entry-row.tsx`
- Create: `components/category-group.tsx`
- Create: `components/entry-section.tsx`

- [ ] **Step 1: Create `components/invoice-upload.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Paperclip, FileText, X } from "lucide-react";

type Props = {
  value: { url: string; filename: string } | null;
  onChange: (val: { url: string; filename: string } | null) => void;
};

export function InvoiceUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const { error } = await res.json();
      setError(error ?? "Upload failed");
      return;
    }
    const { url, filename } = await res.json();
    onChange({ url, filename });
  }

  async function handleRemove() {
    if (!value) return;
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: value.url }),
    });
    onChange(null);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 bg-white border border-[#d4e0d4] rounded-lg px-3 py-2.5">
        <FileText size={16} className="text-[#3d5c3d] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <a href={value.url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium text-[#2d3b2d] hover:text-[#3d5c3d] truncate block">
            {value.filename}
          </a>
        </div>
        <button onClick={handleRemove} className="text-[#8b4a4a] hover:text-[#2d3b2d]">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <label className={`flex items-center gap-3 border-2 border-dashed border-[#b8d0b8] rounded-lg px-3 py-3 cursor-pointer hover:border-[#3d5c3d] hover:bg-[#edf3ed] transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="w-8 h-8 bg-[#e8f0e8] rounded-lg flex items-center justify-center flex-shrink-0">
        <Paperclip size={15} className="text-[#3d5c3d]" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-[#2d3b2d]">
          {uploading ? "Uploading…" : "Attach invoice or receipt"}
        </div>
        <div className="text-xs text-[#8faa8f]">PDF, JPG, PNG — max 10 MB</div>
      </div>
      <span className="bg-white border border-[#d4e0d4] text-[#3d5c3d] text-xs font-semibold px-3 py-1 rounded-md">
        Browse
      </span>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {error && <p className="text-xs text-[#8b4a4a] mt-1">{error}</p>}
    </label>
  );
}
```

- [ ] **Step 2: Create `components/entry-form.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Check, CalendarClock } from "lucide-react";
import { InvoiceUpload } from "@/components/invoice-upload";
import { CATEGORIES, todayISO, type Section } from "@/lib/constants";

type Props = {
  section: Section;
  onSave: () => void;
  onCancel: () => void;
};

type Draft = {
  date: string;
  category: string;
  description: string;
  amount: string;
  recurring: boolean;
  taxDeductible: boolean;
  notes: string;
  invoiceUrl: string | null;
  invoiceFilename: string | null;
};

export function EntryForm({ section, onSave, onCancel }: Props) {
  const categories = CATEGORIES[section];
  const [draft, setDraft] = useState<Draft>({
    date: todayISO(),
    category: categories[0],
    description: "",
    amount: "",
    recurring: false,
    taxDeductible: false,
    notes: "",
    invoiceUrl: null,
    invoiceFilename: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const showRecurring = section !== "purchase";
  const showTax = section !== "purchase";

  async function handleSave() {
    if (!draft.amount || Number(draft.amount) <= 0) { setError("Amount required"); return; }
    setSaving(true);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, section, amount: Number(draft.amount) }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save"); return; }
    onSave();
  }

  const inputClass = "w-full bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]";
  const labelClass = "block text-xs text-[#5f7a5f] uppercase tracking-wider font-semibold mb-1";

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" className={inputClass} value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount (Kč)</label>
          <input type="number" className={inputClass} value={draft.amount} placeholder="0"
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input className={inputClass} value={draft.description} placeholder="Optional"
            onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass}>Notes (optional)</label>
          <input className={inputClass} value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
      </div>

      {(showRecurring || showTax) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {showRecurring && (
            <label className="flex items-center gap-2.5 bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={draft.recurring}
                onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })}
                className="accent-[#3d5c3d] w-4 h-4" />
              <CalendarClock size={14} className="text-[#3d5c3d]" />
              <div>
                <div className="text-sm font-medium text-[#2d3b2d]">Monthly recurring</div>
                <div className="text-xs text-[#8faa8f]">Used for cash flow calculations</div>
              </div>
            </label>
          )}
          {showTax && (
            <label className="flex items-center gap-2.5 bg-[#f5e8e8] border border-[#e8c8c8] rounded-lg px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={draft.taxDeductible}
                onChange={(e) => setDraft({ ...draft, taxDeductible: e.target.checked })}
                className="accent-[#8b4a4a] w-4 h-4" />
              <div>
                <div className="text-sm font-medium text-[#2d3b2d]">Tax deductible</div>
                <div className="text-xs text-[#c17a7a]">Included in tax export</div>
              </div>
            </label>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className={labelClass}>Invoice / receipt</label>
        <InvoiceUpload
          value={draft.invoiceUrl ? { url: draft.invoiceUrl, filename: draft.invoiceFilename! } : null}
          onChange={(v) => setDraft({ ...draft, invoiceUrl: v?.url ?? null, invoiceFilename: v?.filename ?? null })}
        />
      </div>

      {error && <p className="text-sm text-[#8b4a4a] mb-3">{error}</p>}

      <div className="flex gap-2 pt-3 border-t border-[#e8f0e8]">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          <Check size={14} /> {saving ? "Saving…" : "Save entry"}
        </button>
        <button onClick={onCancel} className="text-[#8faa8f] hover:text-[#2d3b2d] px-3 py-2 rounded-lg text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/entry-row.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Trash2, CalendarClock, FileText } from "lucide-react";
import { fmtCZK } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export function EntryRow({ entry, color }: { entry: Entry; color: "sage" | "income" }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    router.refresh();
  }

  const amountColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#2d3b2d] truncate">
            {entry.description || entry.category}
          </span>
          {entry.recurring && (
            <span className="text-[10px] uppercase tracking-wider bg-[#e8f0e8] text-[#3d5c3d] px-2 py-0.5 rounded-full flex items-center gap-1">
              <CalendarClock size={9} /> monthly
            </span>
          )}
          {entry.taxDeductible && (
            <span className="text-[10px] uppercase tracking-wider bg-[#f5e8e8] text-[#8b4a4a] px-2 py-0.5 rounded-full">
              ⊛ tax
            </span>
          )}
          {entry.invoiceUrl && (
            <a href={entry.invoiceUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-wider bg-[#e8f0e8] text-[#3d5c3d] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-[#d4e0d4]">
              <FileText size={9} /> invoice
            </a>
          )}
        </div>
        <div className="text-xs text-[#8faa8f] mt-0.5">
          {entry.date}{entry.notes ? ` · ${entry.notes}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium tabular-nums ${amountColor}`}>
          {fmtCZK(Number(entry.amount))}
        </span>
        <button onClick={handleDelete} className="text-[#8faa8f] hover:text-[#8b4a4a] p-1 rounded">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/category-group.tsx`**

```tsx
import { EntryRow } from "@/components/entry-row";
import { fmtCZK } from "@/lib/constants";
import type { Entry } from "@/db/schema";

type Props = {
  category: string;
  entries: Entry[];
  color: "sage" | "income";
};

export function CategoryGroup({ category, entries, color }: Props) {
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-[#edf3ed] border-b border-[#d4e0d4] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#3d5c3d]">{category}</span>
        <span className={`text-sm font-semibold tabular-nums ${totalColor}`}>{fmtCZK(total)}</span>
      </div>
      <div className="divide-y divide-[#f0f5f0]">
        {entries
          .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
          .map((e) => <EntryRow key={e.id} entry={e} color={color} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/entry-section.tsx`**

```tsx
"use client";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { EntryForm } from "@/components/entry-form";
import { CategoryGroup } from "@/components/category-group";
import { useRouter } from "next/navigation";
import { fmtCZK, type Section } from "@/lib/constants";
import type { Entry } from "@/db/schema";

type Props = {
  title: string;
  subtitle: string;
  section: Section;
  entries: Entry[];
  color: "sage" | "income";
};

export function EntrySection({ title, subtitle, section, entries, color }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalColor = color === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]";

  const grouped = useMemo(() => {
    const g: Record<string, Entry[]> = {};
    entries.forEach((e) => { (g[e.category] ??= []).push(e); });
    return g;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl font-medium text-[#2d3b2d] mb-1">{title}</h2>
          <p className="text-sm text-[#5f7a5f] max-w-xl">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-[#8faa8f]">Total</div>
          <div className={`font-display text-2xl font-medium tabular-nums ${totalColor}`}>{fmtCZK(total)}</div>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-1.5 bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium">
        <Plus size={14} /> Add entry
      </button>

      {showForm && (
        <EntryForm
          section={section}
          onSave={() => { setShowForm(false); router.refresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-[#d4e0d4] rounded-xl p-12 text-center text-[#8faa8f] text-sm">
          No entries yet. Click "Add entry" to start tracking.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <CategoryGroup key={cat} category={cat} entries={items} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/invoice-upload.tsx components/entry-form.tsx components/entry-row.tsx components/category-group.tsx components/entry-section.tsx
git commit -m "feat: add entry form with invoice upload, tax flag, recurring checkbox, and entry list"
```

---

## Task 12: Entry section pages

**Files:**
- Create: `app/(app)/purchase/page.tsx`
- Create: `app/(app)/expenses/page.tsx`
- Create: `app/(app)/income/page.tsx`

- [ ] **Step 1: Create `app/(app)/purchase/page.tsx`**

```tsx
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EntrySection } from "@/components/entry-section";

export default async function PurchasePage() {
  const rows = await db.select().from(entries)
    .where(eq(entries.section, "purchase"))
    .orderBy(desc(entries.date));

  return (
    <EntrySection
      title="Purchase costs"
      subtitle="One-off costs to acquire the property — escrow, fees, mortgage drawdown, renovation."
      section="purchase"
      entries={rows}
      color="sage"
    />
  );
}
```

- [ ] **Step 2: Create `app/(app)/expenses/page.tsx`**

```tsx
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EntrySection } from "@/components/entry-section";

export default async function ExpensesPage() {
  const rows = await db.select().from(entries)
    .where(eq(entries.section, "ongoing"))
    .orderBy(desc(entries.date));

  return (
    <EntrySection
      title="Ongoing expenses"
      subtitle="Monthly and ad-hoc costs — mortgage, SVJ, utilities, repairs. Flag the recurring ones and mark tax-deductible entries for your accountant."
      section="ongoing"
      entries={rows}
      color="sage"
    />
  );
}
```

- [ ] **Step 3: Create `app/(app)/income/page.tsx`**

```tsx
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EntrySection } from "@/components/entry-section";

export default async function IncomePage() {
  const rows = await db.select().from(entries)
    .where(eq(entries.section, "income"))
    .orderBy(desc(entries.date));

  return (
    <EntrySection
      title="Income"
      subtitle="Rent, deposits, reimbursements. Flag recurring rent for yield calculations."
      section="income"
      entries={rows}
      color="income"
    />
  );
}
```

- [ ] **Step 4: Test all three tabs**

```bash
pnpm dev
```

Open each tab — Purchase, Expenses, Income. Add an entry, verify it appears with badges. Add an invoice, verify it uploads and badge appears. Delete an entry, verify it disappears.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/purchase/ app/\(app\)/expenses/ app/\(app\)/income/
git commit -m "feat: add purchase, expenses, income pages with full entry CRUD"
```

---

## Task 13: Dashboard components

**Files:**
- Create: `components/dashboard/kpi-card.tsx`
- Create: `components/dashboard/mini-stat.tsx`
- Create: `components/dashboard/financing-breakdown.tsx`
- Create: `components/dashboard/rate-notification.tsx`
- Create: `components/dashboard/mortgage-card.tsx`
- Create: `components/dashboard/property-value-card.tsx`
- Create: `components/dashboard/recent-activity.tsx`
- Create: `components/dashboard/dashboard.tsx`
- Create: `app/(app)/page.tsx`

- [ ] **Step 1: Create `components/dashboard/kpi-card.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  sublabel: string;
  icon: LucideIcon;
  valueColor?: string;
};

export function KpiCard({ label, value, sublabel, icon: Icon, valueColor = "#2d3b2d" }: Props) {
  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-[#8faa8f]">{label}</div>
        <Icon size={16} className="text-[#8faa8f]" />
      </div>
      <div className="font-display text-3xl font-medium tabular-nums" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="text-xs text-[#8faa8f] mt-2">{sublabel}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/dashboard/mini-stat.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";

type Props = { label: string; value: string; icon: LucideIcon; valueColor?: string };

export function MiniStat({ label, value, icon: Icon, valueColor = "#2d3b2d" }: Props) {
  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-4 flex items-center gap-3">
      <div className="p-2 bg-[#f4f7f4] rounded-lg">
        <Icon size={16} style={{ color: valueColor }} />
      </div>
      <div>
        <div className="text-xs text-[#8faa8f]">{label}</div>
        <div className="font-medium tabular-nums text-sm" style={{ color: valueColor }}>{value}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/dashboard/financing-breakdown.tsx`**

```tsx
import { fmtCZK } from "@/lib/constants";

type Props = { purchasePrice: number; mortgageAmount: number; equityInvested: number };

export function FinancingBreakdown({ purchasePrice, mortgageAmount, equityInvested }: Props) {
  if (purchasePrice <= 0) return null;
  const mortgagePct = Math.min(100, (mortgageAmount / purchasePrice) * 100);
  const equityPct = Math.min(100 - mortgagePct, ((purchasePrice - mortgageAmount) / purchasePrice) * 100);

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8faa8f] mb-1">Financing breakdown</div>
          <div className="font-display text-2xl text-[#2d3b2d]">{fmtCZK(purchasePrice)}</div>
        </div>
        <div className="text-right text-xs text-[#8faa8f]">
          Equity invested: <span className="text-[#2d3b2d] font-medium">{fmtCZK(Math.max(0, equityInvested))}</span>
        </div>
      </div>
      <div className="h-3 bg-[#e8f0e8] rounded-full overflow-hidden flex">
        <div className="bg-[#1c1917] h-full rounded-full" style={{ width: `${mortgagePct}%` }} title="Mortgage" />
        <div className="bg-[#3d5c3d] h-full" style={{ width: `${equityPct}%` }} title="Equity" />
      </div>
      <div className="flex justify-between text-xs text-[#8faa8f] mt-2">
        <span>● Mortgage {fmtCZK(mortgageAmount)}</span>
        <span>● Equity {fmtCZK(purchasePrice - mortgageAmount)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/dashboard/rate-notification.tsx`**

```tsx
"use client";
import { Bell } from "lucide-react";
import { useState } from "react";

type Props = { daysUntil: number; rate: number; fixedUntil: string; onUpdateRate: () => void };

export function RateNotification({ daysUntil, rate, fixedUntil, onUpdateRate }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const month = new Date(fixedUntil).toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-3 bg-[#fffbeb] border border-[#fcd34d] rounded-xl p-4">
      <Bell size={18} className="text-[#92400e] flex-shrink-0" />
      <p className="text-sm text-[#92400e] flex-1">
        Your fixed rate <strong>{(rate * 100).toFixed(2)}%</strong> expires in{" "}
        <strong>{daysUntil} days</strong> ({month}). Contact your bank to renegotiate, then update your rate here.
      </p>
      <button onClick={onUpdateRate}
        className="bg-[#f59e0b] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
        Update rate
      </button>
      <button onClick={() => setDismissed(true)} className="text-[#92400e] text-xs opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/dashboard/mortgage-card.tsx`**

```tsx
import { fmtCZK } from "@/lib/constants";
import { monthlyPayment, paymentSplit, totalsToDate, type MortgageParams } from "@/lib/mortgage";

type Props = { params: MortgageParams };

export function MortgageCard({ params }: Props) {
  if (!params.principal || !params.annualRate || !params.startDate) {
    return (
      <div className="bg-white border border-[#d4e0d4] rounded-xl p-6 text-sm text-[#8faa8f]">
        Add mortgage details in property settings to see payoff progress.
      </div>
    );
  }

  const M = monthlyPayment(params);
  const now = new Date();
  const start = new Date(params.startDate);
  const monthsElapsed = Math.max(1,
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  );
  const split = paymentSplit(params, monthsElapsed);
  const totals = totalsToDate(params);
  const n = params.termYears * 12;
  const paidPct = ((totals.principalPaid / params.principal) * 100).toFixed(1);
  const interestPaidPct = ((totals.interestPaid / totals.totalProjectedInterest) * 100).toFixed(1);
  const equityPct = Math.round((split.principal / M) * 100);
  const interestPct = 100 - equityPct;
  const yearsLeft = Math.floor((n - monthsElapsed) / 12);
  const moLeft = (n - monthsElapsed) % 12;

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#2d3b2d]">Mortgage payoff</span>
        <span className="text-xs text-[#8faa8f]">
          {((params.annualRate) * 100).toFixed(2)}% · {params.termYears}yr ·{" "}
          {params.mortgageRateFixedUntil ? `fixed until ${params.mortgageRateFixedUntil}` : ""}
        </span>
      </div>

      {/* Monthly strip */}
      <div className="bg-[#f4f7f4] rounded-lg px-4 py-3 flex items-center gap-2 mb-4 flex-wrap">
        <div className="text-center flex-1">
          <div className="text-sm font-bold tabular-nums text-[#2d3b2d]">{fmtCZK(M)}</div>
          <div className="text-[10px] text-[#8faa8f]">monthly payment</div>
        </div>
        <div className="text-[#8faa8f] font-bold">=</div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold tabular-nums text-[#2d6a2d]">{fmtCZK(split.principal)}</div>
          <div className="text-[10px] text-[#8faa8f]">→ your property</div>
        </div>
        <div className="text-[#8faa8f] font-bold">+</div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold tabular-nums text-[#6d28d9]">{fmtCZK(split.interest)}</div>
          <div className="text-[10px] text-[#8faa8f]">→ interest</div>
        </div>
      </div>

      {/* Property section */}
      <div className="bg-[#1c1917] rounded-xl p-4 mb-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-[#6b7280] mb-3">🏠 Going to your property (principal)</div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="font-display text-xl font-semibold text-[#d1fae5]">{fmtCZK(totals.principalPaid)}</div>
            <div className="text-[10px] text-[#6ee7b7]">equity built to date</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-white">{fmtCZK(totals.remainingBalance)}</div>
            <div className="text-[10px] text-[#6b7280]">remaining balance</div>
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-[#d1fae5] rounded-full" style={{ width: `${Math.max(0.3, Number(paidPct))}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-[#6b7280]">
          <span className="text-[#6ee7b7]">{paidPct}% yours so far</span>
          <span>payoff: {totals.payoffDate}</span>
        </div>
        <div className="flex gap-2 mt-3">
          {[
            { v: fmtCZK(split.principal), l: "principal/month" },
            { v: `${equityPct}%`, l: "payment → equity" },
            { v: `${yearsLeft}yr ${moLeft}mo`, l: "remaining" },
          ].map(({ v, l }) => (
            <div key={l} className="flex-1 bg-white/8 rounded-lg p-2 text-center">
              <div className="text-sm font-semibold text-white tabular-nums">{v}</div>
              <div className="text-[9px] text-[#6b7280] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interest section */}
      <div className="bg-[#f5f3ff] border border-[#ddd6fe] rounded-xl p-4">
        <div className="text-[9px] font-bold uppercase tracking-widest text-[#8b5cf6]/70 mb-3">Interest payments</div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="font-display text-xl font-semibold text-[#6d28d9]">{fmtCZK(totals.interestPaid)}</div>
            <div className="text-[10px] text-[#7c3aed]/70">interest paid to date</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[#4c1d95]">{fmtCZK(totals.totalProjectedInterest)}</div>
            <div className="text-[10px] text-[#8b5cf6]/70">projected total interest</div>
          </div>
        </div>
        <div className="h-2 bg-[#ddd6fe] rounded-full overflow-hidden mb-1">
          <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: `${Math.max(0.3, Number(interestPaidPct))}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-[#8b5cf6]/70">
          <span>{interestPaidPct}% of total interest paid</span>
          <span>over {params.termYears} years</span>
        </div>
        <div className="flex gap-2 mt-3">
          {[
            { v: fmtCZK(split.interest), l: "interest/month" },
            { v: `${interestPct}%`, l: "payment → bank" },
            { v: fmtCZK(totals.totalProjectedInterest), l: "total projected" },
          ].map(({ v, l }) => (
            <div key={l} className="flex-1 bg-white border border-[#ddd6fe] rounded-lg p-2 text-center">
              <div className="text-sm font-semibold text-[#6d28d9] tabular-nums">{v}</div>
              <div className="text-[9px] text-[#8b5cf6]/80 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[9px] text-[#8faa8f] text-center mt-3">
        Calculated automatically · update rate when fixed period resets
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/dashboard/property-value-card.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtCZK } from "@/lib/constants";
import type { Meta } from "@/db/schema";

export function PropertyValueCard({ meta }: { meta: Meta }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();

  const purchasePrice = Number(meta.purchasePrice);
  const currentValue = Number(meta.currentPropertyValue ?? 0);
  const hasEstimate = currentValue > 0;
  const gainCZK = currentValue - purchasePrice;
  const gainPct = purchasePrice > 0 ? (gainCZK / purchasePrice) * 100 : 0;
  const updatedAt = meta.currentPropertyValueUpdatedAt
    ? new Date(meta.currentPropertyValueUpdatedAt).toLocaleDateString("cs-CZ")
    : null;

  async function saveEstimate() {
    const num = Number(value);
    if (!num || num <= 0) return;
    await fetch("/api/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPropertyValue: num }),
    });
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#2d3b2d]">Property value</span>
        {!editing && (
          <button onClick={() => { setValue(String(currentValue || "")); setEditing(true); }}
            className="text-xs text-[#3d5c3d] border border-[#d4e0d4] rounded-lg px-3 py-1 hover:bg-[#f4f7f4]">
            {hasEstimate ? "Update estimate" : "Add estimate"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="Current estimate (Kč)"
            className="flex-1 bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]" />
          <button onClick={saveEstimate} className="bg-[#3d5c3d] text-[#f4f7f4] px-4 py-2 rounded-lg text-sm font-medium">Save</button>
          <button onClick={() => setEditing(false)} className="text-[#8faa8f] px-3 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      ) : hasEstimate ? (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Purchased at</div>
            <div className="font-display text-xl font-medium text-[#2d3b2d]">{fmtCZK(purchasePrice)}</div>
          </div>
          <div className="text-[#8faa8f] text-xl">→</div>
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Current estimate</div>
            <div className="font-display text-xl font-medium text-[#2d3b2d]">{fmtCZK(currentValue)}</div>
          </div>
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Gain</div>
            <div className={`font-display text-xl font-medium ${gainCZK >= 0 ? "text-[#2d6a2d]" : "text-[#8b4a4a]"}`}>
              {gainCZK >= 0 ? "+" : ""}{fmtCZK(gainCZK)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8faa8f] mb-1">Return</div>
            <div className={`font-display text-xl font-medium ${gainPct >= 0 ? "text-[#2d6a2d]" : "text-[#8b4a4a]"}`}>
              {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#8faa8f]">
          No estimate yet. Add a current market value from Sreality.cz to track appreciation.
        </p>
      )}
      {updatedAt && !editing && (
        <div className="text-[10px] text-[#8faa8f] mt-3">Last updated: {updatedAt}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create `components/dashboard/recent-activity.tsx`**

```tsx
import { fmtCZK } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export function RecentActivity({ entries }: { entries: Entry[] }) {
  const recent = [...entries]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 8);

  return (
    <div className="bg-white border border-[#d4e0d4] rounded-xl p-6">
      <h3 className="font-display text-xl text-[#2d3b2d] mb-4">Recent activity</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-[#8faa8f] py-8 text-center">
          No transactions yet — start by adding a purchase cost or expense.
        </p>
      ) : (
        <div className="divide-y divide-[#f0f5f0]">
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${tx.section === "income" ? "bg-[#2d6a2d]" : "bg-[#8faa8f]"}`} />
                <div>
                  <div className="font-medium text-[#2d3b2d]">{tx.description || tx.category}</div>
                  <div className="text-xs text-[#8faa8f]">{tx.category} · {tx.date}</div>
                </div>
              </div>
              <div className={`font-medium tabular-nums ${tx.section === "income" ? "text-[#2d6a2d]" : "text-[#2d3b2d]"}`}>
                {tx.section === "income" ? "+" : "−"} {fmtCZK(Number(tx.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create `components/dashboard/dashboard.tsx`**

```tsx
"use client";
import { useState } from "react";
import { PiggyBank, Wallet, Percent, KeyRound, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { MiniStat } from "./mini-stat";
import { FinancingBreakdown } from "./financing-breakdown";
import { RateNotification } from "./rate-notification";
import { MortgageCard } from "./mortgage-card";
import { PropertyValueCard } from "./property-value-card";
import { RecentActivity } from "./recent-activity";
import { fmtCZK } from "@/lib/constants";
import { daysUntilRateReset, type Totals } from "@/lib/calculations";
import type { Entry, Meta } from "@/db/schema";
import type { MortgageParams } from "@/lib/mortgage";

type Props = { totals: Totals; meta: Meta; entries: Entry[] };

export function Dashboard({ totals, meta, entries }: Props) {
  const [showMetaEditor, setShowMetaEditor] = useState(false);

  const daysUntilReset = daysUntilRateReset(meta.mortgageRateFixedUntil ?? null);
  const showRateNotification = daysUntilReset !== null && daysUntilReset <= 60;

  const mortgageParams: MortgageParams = {
    principal: Number(meta.mortgageAmount),
    annualRate: Number(meta.mortgageRate),
    termYears: meta.mortgageTermYears,
    startDate: meta.mortgageStartDate ?? "",
  };

  const equityInvested = totals.purchaseTotal - Number(meta.mortgageAmount) + totals.ongoingTotal - totals.incomeTotal;

  return (
    <div className="space-y-6">
      {showRateNotification && (
        <RateNotification
          daysUntil={daysUntilReset!}
          rate={Number(meta.mortgageRate)}
          fixedUntil={meta.mortgageRateFixedUntil!}
          onUpdateRate={() => setShowMetaEditor(true)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total invested" value={fmtCZK(totals.totalInvested)}
          sublabel="Purchase + expenses − income" icon={PiggyBank} />
        <KpiCard label="Net monthly cash flow" value={fmtCZK(totals.netMonthly)}
          sublabel={`${fmtCZK(totals.monthlyIncome)} rent − ${fmtCZK(totals.monthlyOngoing)} costs`}
          icon={Wallet} valueColor={totals.netMonthly >= 0 ? "#2d6a2d" : "#8b4a4a"} />
        <KpiCard label="Net yield" value={`${totals.netYield.toFixed(2)} %`}
          sublabel={`Gross: ${totals.grossYield.toFixed(2)} %`} icon={Percent} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStat label="Purchase costs" value={fmtCZK(totals.purchaseTotal)} icon={KeyRound} />
        <MiniStat label="Expenses to date" value={fmtCZK(totals.ongoingTotal)} icon={ArrowUpCircle} />
        <MiniStat label="Income received" value={fmtCZK(totals.incomeTotal)} icon={ArrowDownCircle} valueColor="#2d6a2d" />
      </div>

      <FinancingBreakdown
        purchasePrice={Number(meta.purchasePrice)}
        mortgageAmount={Number(meta.mortgageAmount)}
        equityInvested={equityInvested}
      />

      <MortgageCard params={mortgageParams} />
      <PropertyValueCard meta={meta} />
      <RecentActivity entries={entries} />
    </div>
  );
}
```

- [ ] **Step 9: Create `app/(app)/page.tsx`**

```tsx
import { db } from "@/db";
import { entries, meta } from "@/db/schema";
import { computeTotals } from "@/lib/calculations";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function DashboardPage() {
  const [allEntries, metaRow] = await Promise.all([
    db.select().from(entries),
    db.query.meta.findFirst(),
  ]);

  const metaData = metaRow ?? {
    id: 1, propertyName: "Ostrava — Nádražní 2965/9",
    purchasePrice: "0", mortgageAmount: "0", targetMonthlyRent: "0",
    sizeM2: "0", mortgageRate: "0", mortgageTermYears: 30,
    mortgageStartDate: null, mortgageRateFixedUntil: null,
    currentPropertyValue: null, currentPropertyValueUpdatedAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  };

  const totals = computeTotals(allEntries, metaData);

  return <Dashboard totals={totals} meta={metaData} entries={allEntries} />;
}
```

- [ ] **Step 10: Test dashboard end-to-end**

```bash
pnpm dev
```

Open http://localhost:3000. Add mortgage details via "edit" in the header. Verify KPI cards, mortgage card with two sections, and recent activity all render correctly.

- [ ] **Step 11: Commit**

```bash
git add components/dashboard/ app/\(app\)/page.tsx
git commit -m "feat: add full dashboard with KPI cards, mortgage payoff card, and property value tracker"
```

---

## Task 14: Export and import API routes

**Files:**
- Create: `app/api/export/route.ts`
- Create: `app/api/import/route.ts`

- [ ] **Step 1: Create `app/api/export/route.ts`**

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries, meta } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import JSZip from "jszip";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const [allEntries, metaRow] = await Promise.all([
    db.select().from(entries),
    db.query.meta.findFirst(),
  ]);

  if (format === "json") {
    const date = new Date().toISOString().slice(0, 10);
    return new Response(
      JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), meta: metaRow, entries: allEntries }, null, 2),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="flat-finance-backup-${date}.json"`,
        },
      }
    );
  }

  if (format === "csv") {
    const bom = "﻿";
    const header = ["Section", "Date", "Category", "Description", "Amount (CZK)", "Recurring", "Tax Deductible", "Notes", "Invoice"];
    const rows = allEntries.map((e) => [
      e.section, e.date, e.category, e.description ?? "",
      e.amount, e.recurring ? "Yes" : "", e.taxDeductible ? "Yes" : "",
      e.notes ?? "", e.invoiceFilename ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const date = new Date().toISOString().slice(0, 10);
    return new Response(bom + csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="flat-finance-${date}.csv"`,
      },
    });
  }

  if (format === "tax") {
    const year = searchParams.get("year") ?? new Date().getFullYear().toString();
    const section = searchParams.get("section") ?? "both";
    const taxOnly = searchParams.get("taxOnly") !== "false";

    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    let filtered = allEntries.filter((e) => {
      const inYear = e.date >= start && e.date <= end;
      const inSection = section === "both" ? e.section !== "purchase" : e.section === section;
      const isTax = !taxOnly || e.taxDeductible;
      return inYear && inSection && isTax;
    });

    const zip = new JSZip();
    const bom = "﻿";
    const header = ["Section", "Date", "Category", "Description", "Amount (CZK)", "Tax Deductible", "Notes", "Invoice"];
    const rows = filtered.map((e) => [
      e.section, e.date, e.category, e.description ?? "",
      e.amount, e.taxDeductible ? "Yes" : "", e.notes ?? "", e.invoiceFilename ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    zip.file("entries.csv", bom + csv);

    // Fetch and add invoice files
    const invoiceFolder = zip.folder("invoices")!;
    await Promise.all(
      filtered
        .filter((e) => e.invoiceUrl && e.invoiceFilename)
        .map(async (e) => {
          try {
            const res = await fetch(e.invoiceUrl!);
            const buf = await res.arrayBuffer();
            const safeName = `${e.date}-${e.category}-${e.invoiceFilename}`.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            invoiceFolder.file(safeName, buf);
          } catch { /* skip failed fetches */ }
        })
    );

    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
    return new Response(zipBuf, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="flat-tax-export-${year}.zip"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}
```

- [ ] **Step 2: Create `app/api/import/route.ts`**

```ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries, meta } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();

  if (body.version !== 1 || !body.meta || !Array.isArray(body.entries)) {
    return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx.delete(entries);
    await tx.delete(meta).where(eq(meta.id, 1));
    await tx.insert(meta).values({ id: 1, ...body.meta });
    if (body.entries.length > 0) {
      await tx.insert(entries).values(body.entries);
    }
  });

  return NextResponse.json({
    ok: true,
    imported: {
      purchase: body.entries.filter((e: { section: string }) => e.section === "purchase").length,
      ongoing: body.entries.filter((e: { section: string }) => e.section === "ongoing").length,
      income: body.entries.filter((e: { section: string }) => e.section === "income").length,
    },
  });
}
```

- [ ] **Step 3: Test exports**

```bash
# JSON backup
curl http://localhost:3000/api/export?format=json -o backup.json
cat backup.json  # should show version, meta, entries

# CSV
curl http://localhost:3000/api/export?format=csv -o entries.csv
# Open in Excel/Numbers — should have BOM, Czech chars render correctly
```

- [ ] **Step 4: Commit**

```bash
git add app/api/export/ app/api/import/
git commit -m "feat: add JSON/CSV/tax-ZIP export and JSON import API routes"
```

---

## Task 15: Deploy to Vercel

**Files:**
- Modify: `package.json` (verify build script)

- [ ] **Step 1: Verify build script includes migration**

In `package.json`, confirm:
```json
{ "scripts": { "build": "drizzle-kit migrate && next build" } }
```

- [ ] **Step 2: Create Neon project and get connection strings**

Go to neon.tech → New project → Copy:
- `DATABASE_URL` (pooled, for app queries)
- `DATABASE_URL_UNPOOLED` (direct, for migrations)

- [ ] **Step 3: Generate a strong AUTH_SECRET**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **Step 4: Set up Vercel project**

```bash
pnpm i -g vercel
vercel link  # link to new Vercel project
```

Go to Vercel dashboard → Project → Settings → Environment Variables. Add:
- `DATABASE_URL` — Neon pooled URL
- `DATABASE_URL_UNPOOLED` — Neon direct URL
- `APP_PASSWORD` — choose a password
- `AUTH_SECRET` — from step 3
- `BLOB_READ_WRITE_TOKEN` — from Vercel Storage → Blob → Create store → copy token

- [ ] **Step 5: Push to deploy**

```bash
git push origin main
```

Vercel auto-deploys. Watch the build log — migration should run, then `next build`.

- [ ] **Step 6: Smoke test production**

Open the Vercel deployment URL:
- [ ] Login page appears
- [ ] Correct password logs in
- [ ] Header shows property name
- [ ] Can add a purchase entry
- [ ] Can add an expense with invoice upload
- [ ] Dashboard shows KPI cards
- [ ] JSON backup downloads correctly
- [ ] Tax export downloads ZIP with CSV

- [ ] **Step 7: (Optional) Add custom domain**

In Vercel → Domains → Add `flat.nextfemai.com`. Copy the CNAME value. In Porkbun DNS → Add CNAME record for `flat` pointing to Vercel's target. Allow 5–10 min to propagate.

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "chore: production-ready — deploy config and smoke test verified"
```

---

## Appendix: Key type reference

```ts
// db/schema.ts exports
type Meta = { id, propertyName, purchasePrice, mortgageAmount, targetMonthlyRent,
  sizeM2, mortgageRate, mortgageTermYears, mortgageStartDate, mortgageRateFixedUntil,
  currentPropertyValue, currentPropertyValueUpdatedAt, createdAt, updatedAt }

type Entry = { id, section, date, category, description, amount, recurring, notes,
  taxDeductible, invoiceUrl, invoiceFilename, createdAt, updatedAt }

// lib/mortgage.ts exports
type MortgageParams = { principal, annualRate, termYears, startDate }
function monthlyPayment(p: MortgageParams): number
function paymentSplit(p, monthNumber): { principal, interest, remainingBalance }
function totalsToDate(p): { principalPaid, interestPaid, remainingBalance, monthsElapsed, totalProjectedInterest, payoffDate }

// lib/calculations.ts exports
type Totals = { purchaseTotal, ongoingTotal, incomeTotal, monthlyOngoing, monthlyIncome,
  netMonthly, annualNet, totalInvested, grossYield, netYield, pricePerM2,
  appreciationCZK, appreciationPct }
function computeTotals(entries, meta): Totals
function daysUntilRateReset(fixedUntil): number | null

// lib/constants.ts exports
const PURCHASE_CATEGORIES, ONGOING_CATEGORIES, INCOME_CATEGORIES
type Section = "purchase" | "ongoing" | "income"
function fmtCZK(n): string
function todayISO(): string
```
