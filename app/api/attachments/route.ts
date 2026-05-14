import { NextResponse } from "next/server";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { put } from "@vercel/blob";

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const entryId = formData.get("entryId") as string | null;

  if (!file || !entryId) return NextResponse.json({ error: "Missing file or entryId" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const mimeType = file.type || "application/octet-stream";

  const blob = await put(`attachments/${entryId}/${Date.now()}-${file.name}`, file, {
    access: "private",
    contentType: mimeType,
  });

  const [attachment] = await db.insert(attachments).values({
    entryId,
    filename: file.name,
    blobUrl: blob.url,
    mimeType,
    sizeBytes: file.size,
  }).returning();

  return NextResponse.json({ attachment }, { status: 201 });
}
