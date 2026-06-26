import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:3002";
const enableApiProxy = process.env.NEXT_PROXY_API === "true";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: "standalone",
  transpilePackages: ["@quantflow/ui", "@quantflow/contracts"],
  async rewrites() {
    if (!enableApiProxy) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
