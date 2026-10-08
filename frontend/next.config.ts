import type { NextConfig } from "next";
const config: NextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: "/job/:pin(\\d{6})",
        destination: "/jobs/:pin/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      fallback: [{ source: "/job/:slug", destination: "/job/view" }],
    };
  },
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
