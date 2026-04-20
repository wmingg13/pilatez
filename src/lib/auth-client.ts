// src/lib/auth-client.ts
// Better-Auth browser client — use this in Client Components

import { createAuthClient } from "better-auth/react";

// Use the current page origin in the browser so it always matches,
// regardless of preview URLs or custom domains.
const baseURL = typeof window !== "undefined"
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

export const authClient = createAuthClient({ baseURL });

export const { signIn, signOut, useSession } = authClient;