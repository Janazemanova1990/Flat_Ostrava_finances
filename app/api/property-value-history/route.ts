import { NextResponse } from "next/server";
import { db } from "@/db";
import { propertyValueHistory, meta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Post = z.object({
  value: z.coerce.number(),
  pricePerM2: z.coerce.number().nullable().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = Post.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { value, pricePerM2 } = parsed.data;

  const [row] = await db.insert(propertyValueHistory).values({
    value: String(value),
    pricePerM2: pricePerM2 != null ? String(pricePerM2) : null,
  }).returning();

  return NextResponse.json({ snapshot: row });
}
