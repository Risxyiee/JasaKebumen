import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare Workers compatible */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
