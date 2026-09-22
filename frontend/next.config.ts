import type { NextConfig } from "next";
const config: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      poll: 1000,
      ignored: ["**/node_modules/**", "**/.git/**"],
    };
    return config;
  },
};
export default config;
