import type { NextConfig } from "next";

// output: "standalone" is required for Docker but must be absent for Vercel.
// Set NEXT_OUTPUT=standalone in Docker (already set in Dockerfile via ARG/ENV),
// leave it unset in Vercel env vars.
const isStandalone = process.env.NEXT_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  ...(isStandalone && { output: "standalone" }),
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "") ?? "",
      ].filter(Boolean),
    },
  },
};

export default nextConfig;