import type { Job } from "@/types";

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

export function jobPlacePathSegment(value: string) {
  return encodeURIComponent(String(value || "").trim());
}

export function decodeJobPlaceSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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
 * Canonical metadata still uses the clean {@link jobHref} path.
 */
export function jobHrefWithPlace(job: Job) {
  if (job.id.startsWith("posted_")) {
    return `/job/local?id=${encodeURIComponent(job.id)}`;
  }
  const city = (job.city || "").trim();
  const locality = (job.locality || "").trim();
  const slug = jobCanonicalSlug(job);
  if (!city) return `/job/${encodeURIComponent(slug)}/`;
  if (!locality) {
    return `/job/${jobPlacePathSegment(city)}/${encodeURIComponent(slug)}/`;
  }
  return `/job/${jobPlacePathSegment(city)}/${jobPlacePathSegment(locality)}/${encodeURIComponent(slug)}/`;
}
