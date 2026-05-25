import { NextResponse } from "next/server";
import { makeAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  const valid =
    password === process.env.APP_PASSWORD ||
    (process.env.GUEST_PASSWORD && password === process.env.GUEST_PASSWORD);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true }, {
    headers: { "Set-Cookie": await makeAuthCookie() },
  });
}
