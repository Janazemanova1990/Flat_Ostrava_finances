import { NextResponse } from "next/server";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await del(attachment.blobUrl).catch(() => null);
  await db.delete(attachments).where(eq(attachments.id, id));
  return NextResponse.json({ ok: true });
}
