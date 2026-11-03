import type { NextConfig } from "next";
const config: NextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "gigkaro.in" }],
        destination: "https://www.gigkaro.in/:path*",
        permanent: true,
      },
      {
        source: "/job/:pin(\\d{6})",
        destination: "/jobs/?location=:pin",
        permanent: false,
      },
      {
        source: "/jobs/:pin(\\d{6})",
        destination: "/jobs/?location=:pin",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      fallback: [
        // Job detail is handled by /job/[slug] (dynamicParams). Keep /job/view
        // as a manual client fallback only — rewriting every /job/* here caused
        // Vercel routing to 500 on the dynamic segment.
        { source: "/blog/:slug", destination: "/blog/view" },
      ],
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
