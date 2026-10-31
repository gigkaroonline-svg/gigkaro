import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/metadata";

const privatePaths = [
  "/admin",
  "/employer",
  "/candidate",
  "/login",
  "/register",
  "/verify-otp",
  "/job/local",
  "/job/view",
  "/blog/view",
  "/jobs?",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog/"],
        disallow: privatePaths,
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
