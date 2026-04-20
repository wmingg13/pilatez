// src/middleware.ts
// Edge-safe middleware — checks for Better Auth session cookie.
// Better Auth prefixes the cookie with __Secure- on HTTPS (production).

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const cookies = request.cookies;

  // Better Auth sets the session cookie with the __Secure- prefix on HTTPS.
  // Check both variants so it works on both local (http) and Vercel (https).
  const hasSession =
    cookies.has("better-auth.session_token") ||
    cookies.has("__Secure-better-auth.session_token");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};