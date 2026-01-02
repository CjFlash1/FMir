import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker and custom server deployments
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2048mb', // Increase limit for uploads
    },
  },
};

export default nextConfig;
