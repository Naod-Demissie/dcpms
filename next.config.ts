import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ✅ Skip type checking on build
  },
  // other config options...
};

export default nextConfig;
