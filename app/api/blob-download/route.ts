import { NextResponse } from "next/server";

// Proxies private Vercel Blob files — fetches with auth token server-side
// so the BLOB_READ_WRITE_TOKEN is never exposed to the browser.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  }).catch(() => null);

  if (!response?.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
