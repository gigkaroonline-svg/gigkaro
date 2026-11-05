import type { Job } from "@/types";
import {
  getCityBySlug,
  getLocalityInCity,
  slugifyPlace,
} from "@/lib/services/locations";

/** Nationwide roles are stored as title-560034; hubs use the pinless form. */
export function slugWithoutPincode(slug: string) {
  return (
    String(slug || "")
      .replace(/-\d{6}(?=-|$)/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || String(slug || "")
  );
}

export function jobCanonicalSlug(job: Pick<Job, "slug" | "showEverywhere">) {
  return job.showEverywhere ? slugWithoutPincode(job.slug) : job.slug;
}

export function jobCanonicalPath(job: Pick<Job, "slug" | "showEverywhere">) {
  return `/job/${jobCanonicalSlug(job)}`;
}

/** Lowercase hyphenated place segment (no %20). */
export function jobPlacePathSegment(value: string) {
  return slugifyPlace(String(value || "").trim());
}

export function decodeJobPlaceSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Human label from a URL place segment (delhi → Delhi, aman-vihar → Aman Vihar). */
export function jobPlaceDisplayName(
  segment: string,
  kind: "city" | "locality" = "city",
  citySegment = "",
) {
  const raw = decodeJobPlaceSegment(segment).trim();
  if (!raw) return "";
  const key = slugifyPlace(raw);
  if (kind === "city") {
    const city = getCityBySlug(key);
    if (city) return city.name;
  }
  if (kind === "locality" && citySegment) {
    const hit = getLocalityInCity(slugifyPlace(citySegment), key);
    if (hit) return hit.locality;
  }
  return key
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Clean indexable job URL (no city/locality). */
export function jobHref(job: Job) {
  if (job.id.startsWith("posted_")) {
    return `/job/local?id=${encodeURIComponent(job.id)}`;
  }
  return `${jobCanonicalPath(job)}/`;
}

/**
 * Place-aware card/hub links: `/job/{city}/{locality}/{slug}/` (slug last).
 * City/locality segments are lowercase with hyphens (no %20).
 * Canonical metadata still uses the clean {@link jobHref} path.
 */
export function jobHrefWithPlace(job: Job) {
  if (job.id.startsWith("posted_")) {
    return `/job/local?id=${encodeURIComponent(job.id)}`;
  }
  const city = (job.city || "").trim();
  const locality = (job.locality || "").trim();
  const slug = jobCanonicalSlug(job);
  if (!city) return `/job/${slug}/`;
  const citySeg = jobPlacePathSegment(city);
  if (!locality) return `/job/${citySeg}/${slug}/`;
  return `/job/${citySeg}/${jobPlacePathSegment(locality)}/${slug}/`;
}

/** Place paths are rewritten to /job/view — soft App Router nav 307/500s on Vercel. */
export function jobHrefNeedsHardNav(href: string) {
  const path = String(href || "").split("?")[0].replace(/\/$/, "");
  const segs = path.split("/").filter(Boolean);
  return segs[0] === "job" && segs.length >= 3;
}
