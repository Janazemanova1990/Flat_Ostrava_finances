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
  const [row] = await db.update(meta).set(updates).where(eq(meta.id, 1)).returning();
  return NextResponse.json({ meta: row });
}
