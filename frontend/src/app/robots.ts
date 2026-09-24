import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/employer",
        "/candidate",
        "/login",
        "/register",
        "/verify-otp",
        "/job/local",
        "/job/view",
      ],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
