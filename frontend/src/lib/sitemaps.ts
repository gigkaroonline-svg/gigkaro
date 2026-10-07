import { getLocations } from "@/lib/services/locations";
import { canonicalUrl, siteOrigin } from "@/lib/metadata";

export const sitemapRevalidate = 3600;

const staticPaths = [
  "/",
  "/jobs",
  "/locations",
  "/categories",
  "/about",
  "/blog",
  "/contact",
  "/hire",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

const categoryPaths = [
  "/delivery-jobs",
  "/warehouse-jobs",
  "/logistics-jobs",
  "/field-jobs",
  "/ev-rider-jobs",
] as const;

export type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

function apiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
  ).replace(/\/$/, "");
}

function entry(
  path: string,
  priority: number,
  lastModified?: string | null,
): SitemapEntry {
  return {
    url: canonicalUrl(path),
    changeFrequency: priority >= 0.8 ? "daily" : "weekly",
    priority,
    ...(lastModified ? { lastModified } : {}),
  };
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function toUrlSetXml(entries: SitemapEntry[]) {
  const body = entries
    .map((item) => {
      const parts = [`    <loc>${escapeXml(item.url)}</loc>`];
      if (item.lastModified) {
        parts.push(`    <lastmod>${escapeXml(item.lastModified)}</lastmod>`);
      }
      if (item.changeFrequency) {
        parts.push(
          `    <changefreq>${escapeXml(item.changeFrequency)}</changefreq>`,
        );
      }
      if (typeof item.priority === "number") {
        parts.push(`    <priority>${item.priority.toFixed(1)}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function toSitemapIndexXml(
  files: { path: string; lastModified?: string }[],
) {
  const body = files
    .map((file) => {
      const loc = `${siteOrigin}${file.path.startsWith("/") ? file.path : `/${file.path}`}`;
      const parts = [`    <loc>${escapeXml(loc)}</loc>`];
      if (file.lastModified) {
        parts.push(`    <lastmod>${escapeXml(file.lastModified)}</lastmod>`);
      }
      return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export function xmlResponse(xml: string, revalidate = sitemapRevalidate) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
    },
  });
}

export function buildStaticSitemap(): SitemapEntry[] {
  return staticPaths.map((path) => entry(path, path === "/" ? 1 : 0.8));
}

export function buildLocationsSitemap(): SitemapEntry[] {
  const cities = [
    ...new Set(getLocations().map((place) => place.slug).filter(Boolean)),
  ];
  return categoryPaths.flatMap((path) =>
    cities.map((city) => entry(`${path}/${city}`, 0.6)),
  );
}

export function buildPincodesSitemap(): SitemapEntry[] {
  const pins = [
    ...new Set(getLocations().map((place) => place.pincode).filter(Boolean)),
  ];
  return [
    ...pins.map((pin) => entry(`/jobs/${pin}`, 0.7)),
    ...categoryPaths.flatMap((path) =>
      pins.map((pin) => entry(`${path}/${pin}`, 0.6)),
    ),
  ];
}

export async function buildJobsSitemap(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${apiBase()}/jobs`, {
      next: { revalidate: sitemapRevalidate },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      jobs?: { slug?: string; postedAt?: string; status?: string }[];
    };
    return (data.jobs || [])
      .filter(
        (job) =>
          Boolean(job.slug) &&
          (!job.status || job.status.toLowerCase() === "active"),
      )
      .map((job) => entry(`/job/${job.slug}`, 0.7, job.postedAt || null));
  } catch {
    return [];
  }
}

export async function buildBlogSitemap(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${apiBase()}/blogs`, {
      next: { revalidate: sitemapRevalidate },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      posts?: {
        slug?: string;
        updatedAt?: string | null;
        publishedAt?: string | null;
      }[];
    };
    return (data.posts || [])
      .filter((post) => Boolean(post.slug))
      .map((post) =>
        entry(
          `/blog/${post.slug}`,
          0.6,
          post.updatedAt || post.publishedAt || null,
        ),
      );
  } catch {
    return [];
  }
}

export const sitemapIndexFiles = [
  "/sitemap-static.xml",
  "/sitemap-jobs.xml",
  "/sitemap-locations.xml",
  "/sitemap-pincodes.xml",
  "/sitemap-blog.xml",
] as const;
