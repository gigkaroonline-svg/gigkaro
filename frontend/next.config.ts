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
        // Prerendered paths are served from the filesystem first. Unknown
        // dynamic paths must not SSR on Vercel (that 500s); fall back to the
        // static client shells instead — same pattern as blog.
        { source: "/blog/:slug", destination: "/blog/view" },
        // Unknown / place job paths → static client shell (Vercel SSR 500s otherwise).
        // Use hard <a> navigations for multi-segment job URLs so App Router soft
        // nav does not fight this rewrite.
        { source: "/job/:path*", destination: "/job/view" },
        { source: "/locations/:slug/:locality", destination: "/locations/view" },
        { source: "/jobs/:location/:company", destination: "/jobs/" },
        { source: "/jobs/:location", destination: "/jobs/" },
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
