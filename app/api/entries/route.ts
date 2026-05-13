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

  const [entry] = await db.insert(entries).values({
    ...parsed.data,
    amount: String(parsed.data.amount),
  }).returning();
  return NextResponse.json({ entry }, { status: 201 });
}
