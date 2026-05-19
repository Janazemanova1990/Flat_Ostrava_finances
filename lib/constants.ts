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

/** Formats any ISO date string "YYYY-MM-DD" or Date object → "DD.MM.YYYY" */
export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (value instanceof Date) {
    return `${String(value.getDate()).padStart(2, "0")}.${String(value.getMonth() + 1).padStart(2, "0")}.${value.getFullYear()}`;
  }
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}
