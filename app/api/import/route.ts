import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries, meta } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json();

  if (body.version !== 1 || !body.meta || !Array.isArray(body.entries)) {
    return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx.delete(entries);
    await tx.delete(meta).where(eq(meta.id, 1));
    await tx.insert(meta).values({ id: 1, ...body.meta });
    if (body.entries.length > 0) {
      await tx.insert(entries).values(body.entries);
    }
  });

  return NextResponse.json({
    ok: true,
    imported: {
      purchase: body.entries.filter((e: { section: string }) => e.section === "purchase").length,
      ongoing: body.entries.filter((e: { section: string }) => e.section === "ongoing").length,
      income: body.entries.filter((e: { section: string }) => e.section === "income").length,
    },
  });
}
