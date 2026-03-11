import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost', 
        '*.devtunnels.ms', 
        '*.github.dev', 
        '*.app.github.dev'
      ]
    }
  }
};

export default nextConfig;
