import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Fly.io Docker deployment — produces a minimal self-contained build
  output: 'standalone',

  images: {
    // Allow external image domains used in the dashboard
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
