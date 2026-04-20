// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn:  60 * 60 * 24 * 7,
    updateAge:  60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "ADMIN",
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

// ── Username → internal email helper ────────────────────────────────────────
// We store credentials as <username>@letzpilates.internal so Better Auth's
// email/password flow works unchanged, but users only ever see/enter usernames.
export const INTERNAL_DOMAIN = "letzpilates.internal";
export function usernameToEmail(username: string): string {
  // If someone passes a real email, use it as-is (backwards compat)
  if (username.includes("@")) return username;
  return `${username.toLowerCase().trim()}@${INTERNAL_DOMAIN}`;
}