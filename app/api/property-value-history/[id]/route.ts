import { NextResponse } from "next/server";
import { db } from "@/db";
import { propertyValueHistory, meta } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const Patch = z.object({
  pricePerM2: z.coerce.number(),
  sizeM2: z.coerce.number(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { pricePerM2, sizeM2 } = parsed.data;
  const newValue = Math.round(pricePerM2 * sizeM2);

  const [row] = await db
    .update(propertyValueHistory)
    .set({ value: String(newValue), pricePerM2: String(pricePerM2) })
    .where(eq(propertyValueHistory.id, id))
    .returning();

  // keep meta in sync with latest value
  const latest = await db
    .select()
    .from(propertyValueHistory)
    .orderBy(desc(propertyValueHistory.recordedAt))
    .limit(1);
  if (latest[0]) {
    await db.update(meta).set({ currentPropertyValue: latest[0].value, updatedAt: new Date() }).where(eq(meta.id, 1));
  }

  return NextResponse.json({ snapshot: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(propertyValueHistory).where(eq(propertyValueHistory.id, id));

  // update meta to reflect new latest (or null)
  const latest = await db
    .select()
    .from(propertyValueHistory)
    .orderBy(desc(propertyValueHistory.recordedAt))
    .limit(1);
  await db.update(meta).set({
    currentPropertyValue: latest[0]?.value ?? null,
    currentPropertyValueUpdatedAt: latest[0] ? latest[0].recordedAt : null,
    updatedAt: new Date(),
  }).where(eq(meta.id, 1));

  return NextResponse.json({ ok: true });
}
