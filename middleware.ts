import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidCookie } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = request.headers.get("cookie");
  if (!(await isValidCookie(cookie))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
