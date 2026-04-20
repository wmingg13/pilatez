// src/app/api/seed/route.ts
// ONE-TIME master admin seed endpoint for Vercel deployment.
// Protected by SEED_SECRET env var — set this in Vercel dashboard.
// After seeding, DELETE this file or remove SEED_SECRET to disable it.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usernameToEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Guard with a secret token — set SEED_SECRET in Vercel env vars
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SEED_SECRET not set — endpoint disabled." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const secretTrimmed = secret.trim();

  if (token !== secretTrimmed) {
    return NextResponse.json({
      error: "Invalid token.",
      hint: "Check SEED_SECRET in Vercel env vars has no surrounding quotes or spaces.",
    }, { status: 401 });
  }

  const username = process.env.MASTER_ADMIN_USERNAME || "admin";
  const password = process.env.MASTER_ADMIN_PASSWORD;
  const name     = process.env.MASTER_ADMIN_NAME     || "admin";

  if (!password) {
    return NextResponse.json({ error: "MASTER_ADMIN_PASSWORD not set." }, { status: 400 });
  }

  const email    = usernameToEmail(username);
  const baseUrl  = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  // Check if already seeded
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: true, message: `Admin "${username}" already exists.` });
  }

  // Create via Better Auth sign-up endpoint
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Origin": baseUrl },
    body:    JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: `Sign-up failed: ${body}` }, { status: 500 });
  }

  // Elevate to MASTER_ADMIN
  await prisma.user.update({
    where: { email },
    data:  { role: "MASTER_ADMIN", emailVerified: true },
  });

  return NextResponse.json({ ok: true, message: `Master admin "${username}" created successfully.` });
}