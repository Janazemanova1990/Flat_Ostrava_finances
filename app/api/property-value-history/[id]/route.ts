import { NextResponse } from "next/server";
import { db } from "@/db";
import { propertyValueHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  return NextResponse.json({ snapshot: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(propertyValueHistory).where(eq(propertyValueHistory.id, id));
  return NextResponse.json({ ok: true });
}
