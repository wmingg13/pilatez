// src/app/api/photos/proxy/route.ts
// Server-side image proxy — fetches a presigned R2 URL from the server
// (no CORS restriction) and streams the bytes back to the browser.
// The client passes the presigned URL as a query param.
// Auth is required — unauthenticated requests are rejected.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const r2Res = await fetch(url, { cache: "no-store" });

    if (!r2Res.ok) {
      return NextResponse.json(
        { error: `R2 fetch failed: ${r2Res.status}` },
        { status: r2Res.status }
      );
    }

    const contentType = r2Res.headers.get("content-type") ?? "image/jpeg";
    const buffer      = await r2Res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":  contentType,
        "Cache-Control": "private, max-age=900", // match presign TTL
      },
    });
  } catch (err) {
    console.error("[proxy] fetch error:", err);
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 500 });
  }
}