import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: "standalone",
  transpilePackages: ["@quantflow/ui", "@quantflow/contracts"],
};

export default nextConfig;
