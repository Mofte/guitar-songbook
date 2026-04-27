import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export für Vercel Deployment
  output: process.env.EXPORT_STATIC ? "export" : undefined,
};

export default nextConfig;
