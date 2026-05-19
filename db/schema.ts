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

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  blobUrl: text("blob_url").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const propertyValueHistory = pgTable("property_value_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  pricePerM2: numeric("price_per_m2", { precision: 10, scale: 2 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export type PropertyValueSnapshot = typeof propertyValueHistory.$inferSelect;
export type Meta = typeof meta.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type EntryWithAttachments = Entry & { attachments: Attachment[] };
