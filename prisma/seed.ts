// prisma/seed.ts
// Seeds the master admin account on first run.
// Works for both local Docker and Vercel (called via `npm run prisma:seed`).
// Uses Prisma + Node crypto directly — no Better Auth import needed.

import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const prisma    = new PrismaClient();
const scryptAsync = promisify(scrypt);

const INTERNAL_DOMAIN = "letzpilates.internal";

function usernameToEmail(username: string): string {
  if (username.includes("@")) return username;
  return `${username.toLowerCase().trim()}@${INTERNAL_DOMAIN}`;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${hash.toString("hex")}:${salt}`;
}

async function main() {
  const username = process.env.MASTER_ADMIN_USERNAME ?? "admin";
  const password = process.env.MASTER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name     = process.env.MASTER_ADMIN_NAME     ?? "admin";

  const email = usernameToEmail(username);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Master admin already exists (username: ${username})`);
    return;
  }

  const hashedPassword = await hashPassword(password);
  const userId         = randomBytes(12).toString("hex");

  await prisma.user.create({
    data: {
      id:            userId,
      name,
      email,
      emailVerified: true,
      role:          "MASTER_ADMIN",
    },
  });

  await prisma.account.create({
    data: {
      id:         randomBytes(12).toString("hex"),
      accountId:  userId,
      providerId: "credential",
      userId,
      password:   hashedPassword,
    },
  });

  console.log(`✅ Master admin created (username: ${username})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());