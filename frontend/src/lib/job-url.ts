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

/** Clean indexable job URL (no city/locality query). */
export function jobHref(job: Job) {
  if (job.id.startsWith("posted_")) {
    return `/job/local?id=${encodeURIComponent(job.id)}`;
  }
  return `${jobCanonicalPath(job)}/`;
}

/**
 * Card/hub links include city + locality in the query (never pincode).
 * Canonical metadata still uses the clean {@link jobHref} path.
 */
export function jobHrefWithPlace(job: Job) {
  if (job.id.startsWith("posted_")) {
    return `/job/local?id=${encodeURIComponent(job.id)}`;
  }
  const city = (job.city || "").trim();
  const locality = (job.locality || "").trim();
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (locality) params.set("locality", locality);
  const qs = params.toString();
  const base = `${jobCanonicalPath(job)}/`;
  return qs ? `${base}?${qs}` : base;
}
