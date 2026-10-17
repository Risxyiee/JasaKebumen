import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare Workers compatible */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* Keep Prisma & pg out of the Next/Turbopack bundle.
     OpenNext re-bundles them for workerd with the "workerd" condition,
     which resolves @prisma/client to its WASM query-compiler variant. */
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
