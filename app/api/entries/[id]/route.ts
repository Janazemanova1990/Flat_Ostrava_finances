import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries, attachments } from "@/db/schema";
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

  const { amount, ...rest } = parsed.data;
  const updateData = {
    ...rest,
    updatedAt: new Date(),
    ...(amount != null ? { amount: String(amount) } : {}),
  };
  const [entry] = await db.update(entries)
    .set(updateData)
    .where(eq(entries.id, id))
    .returning();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry] = await db.select().from(entries).where(eq(entries.id, id));
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete legacy single invoice blob
  if (entry.invoiceUrl) await del(entry.invoiceUrl).catch(() => null);

  // Delete all attachment blobs (DB rows handled by ON DELETE CASCADE)
  const entryAttachments = await db.select().from(attachments).where(eq(attachments.entryId, id));
  await Promise.all(entryAttachments.map((a) => del(a.blobUrl).catch(() => null)));

  await db.delete(entries).where(eq(entries.id, id));
  return NextResponse.json({ ok: true });
}
