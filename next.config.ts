import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@x402/fetch", "@x402/stellar"],
};

export default nextConfig;
