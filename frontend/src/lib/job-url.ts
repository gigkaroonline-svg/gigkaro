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
 * Card/hub links use `/job/{slug}/{city}/{locality}/` (never pincode).
 * Canonical metadata still uses the clean {@link jobHref} path.
 */
export function jobHrefWithPlace(job: Job) {
  if (job.id.startsWith("posted_")) {
    return `/job/local?id=${encodeURIComponent(job.id)}`;
  }
  const city = (job.city || "").trim();
  const locality = (job.locality || "").trim();
  const base = `${jobCanonicalPath(job)}/`;
  if (!city) return base;
  if (!locality) return `${base}${jobPlacePathSegment(city)}/`;
  return `${base}${jobPlacePathSegment(city)}/${jobPlacePathSegment(locality)}/`;
}
