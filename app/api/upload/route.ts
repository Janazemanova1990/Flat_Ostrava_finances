import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

const MAX_SIZE = 10 * 1024 * 1024;
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

  return NextResponse.json({ url: blob.url, filename: file.name, size: file.size });
}

export async function DELETE(request: Request) {
  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  await del(url);
  return NextResponse.json({ ok: true });
}
