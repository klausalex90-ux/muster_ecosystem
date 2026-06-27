import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://whop.com https://*.whop.com;",
          },
        ],
        source: "/:path*",
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
