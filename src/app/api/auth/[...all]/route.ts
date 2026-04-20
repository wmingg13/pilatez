// src/app/api/auth/[...all]/route.ts
// Better-Auth requires a catch-all API route to handle all auth endpoints:
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/session
//   ...and more

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
