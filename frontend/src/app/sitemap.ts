import type { MetadataRoute } from "next";
import { getLocations } from "@/lib/services/locations";
import { canonicalUrl } from "@/lib/metadata";

export const revalidate = 3600;

const staticPaths = [
  "/",
  "/jobs",
  "/locations",
  "/categories",
  "/about",
  "/contact",
  "/hire",
  "/privacy",
  "/terms",
  "/cookies",
];

const categoryPaths = [
  "/delivery-jobs",
  "/warehouse-jobs",
  "/logistics-jobs",
  "/field-jobs",
  "/ev-rider-jobs",
];

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: canonicalUrl(path),
    changeFrequency: priority >= 0.8 ? "daily" : "weekly",
    priority,
  };
}

async function jobPaths() {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
  ).replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/jobs`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: { slug?: string }[] };
    return (data.jobs || [])
      .map((job) => job.slug)
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => entry(`/job/${slug}`, 0.7));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const places = getLocations();
  const pins = [...new Set(places.map((place) => place.pincode))];
  const areas = [
    ...new Set(places.flatMap((place) => [place.slug, place.pincode])),
  ];
  const jobs = await jobPaths();
  return [
    ...staticPaths.map((path) => entry(path, path === "/" ? 1 : 0.8)),
    ...pins.map((pin) => entry(`/jobs/${pin}`, 0.7)),
    ...categoryPaths.flatMap((path) =>
      areas.map((area) => entry(`${path}/${area}`, 0.6)),
    ),
    ...jobs,
  ];
}
