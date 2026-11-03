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
 * Hub cards may pass place context for breadcrumb/openings copy.
 * Those URLs stay noindex; canonical points at {@link jobHref}.
 */
export function jobHrefWithPlace(job: Job) {
  if (job.id.startsWith("posted_")) {
    return `/job/local?id=${encodeURIComponent(job.id)}`;
  }
  const fromHub = job.showEverywhere || job.id.includes("__");
  if (!fromHub) return jobHref(job);
  const params = new URLSearchParams();
  if (job.city?.trim()) params.set("city", job.city.trim());
  if (job.locality?.trim()) params.set("locality", job.locality.trim());
  const qs = params.toString();
  const base = `${jobCanonicalPath(job)}/`;
  return qs ? `${base}?${qs}` : base;
}
