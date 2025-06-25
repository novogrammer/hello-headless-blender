import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',            // クライアントからくる /api/ 以下のリクエスト
        destination: 'http://backend:4000/api/:path*', // Docker ネットワーク上の backend:4000/api/ に転送
      },
      {
        source: '/admin/:path*',
        destination: 'http://backend:4000/admin/:path*',
      },
    ]
  },
};

export default nextConfig;
