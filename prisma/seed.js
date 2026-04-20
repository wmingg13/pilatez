// prisma/seed.js — CJS, no build step needed
// Uses Better Auth's own sign-up HTTP endpoint so the password hash format
// is always correct — no manual hashing that can drift from BA's implementation.
"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma           = new PrismaClient();
const INTERNAL_DOMAIN  = "letzpilates.internal";

function usernameToEmail(username) {
  if (username.includes("@")) return username;
  return `${username.toLowerCase().trim()}@${INTERNAL_DOMAIN}`;
}

async function main() {
  const username = process.env.MASTER_ADMIN_USERNAME || "admin";
  const password = process.env.MASTER_ADMIN_PASSWORD || "ChangeMe123!";
  const name     = process.env.MASTER_ADMIN_NAME     || "admin";
  const baseUrl  = process.env.BETTER_AUTH_URL       || "http://localhost:3000";
  const email    = usernameToEmail(username);

  // Already seeded?
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Master admin already exists (username: ${username})`);
    return;
  }

  // Use Better Auth's sign-up endpoint — it handles password hashing correctly
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Origin": baseUrl },
    body:    JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sign-up failed (${res.status}): ${body}`);
  }

  // Elevate to MASTER_ADMIN
  await prisma.user.update({
    where: { email },
    data:  { role: "MASTER_ADMIN", emailVerified: true },
  });

  console.log(`✅ Master admin created (username: ${username})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());