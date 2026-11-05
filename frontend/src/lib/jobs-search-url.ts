/** Build public /jobs search URLs. Prefer path form when location + company. */

import { getCityBySlug, slugifyPlace } from "@/lib/services/locations";

export type JobsSearchTarget = {
  location?: string;
  company?: string;
  category?: string;
  radius?: string;
  city?: string;
  citySlug?: string;
};

function clean(value?: string) {
  return String(value || "").trim();
}

/** Path segment for city/company URLs (keeps readable names like Noida). */
export function jobsPathSegment(value: string) {
  return encodeURIComponent(clean(value));
}

export function decodeJobsPathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** True when a single /jobs/{segment}/ path should be treated as a place. */
export function isJobsLocationSegment(segment: string) {
  const value = clean(decodeJobsPathSegment(segment));
  if (!value) return false;
  if (/^\d{6}$/.test(value)) return true;
  return Boolean(getCityBySlug(slugifyPlace(value)));
}

/** Parse /jobs/{location}/, /jobs/{company}/, or /jobs/{location}/{company}/. */
export function parseJobsPath(pathname: string) {
  const segs = pathname.split("/").filter(Boolean);
  if (segs[0] !== "jobs" || segs.length < 2) {
    return { location: "", company: "" };
  }
  const first = decodeJobsPathSegment(segs[1]);
  if (segs.length >= 3) {
    return {
      location: first,
      company: decodeJobsPathSegment(segs[2]),
    };
  }
  if (isJobsLocationSegment(first)) {
    return { location: first, company: "" };
  }
  return { location: "", company: first };
}

/**
 * `/jobs/{location}/{company}/` when both are set.
 * `/jobs/{company}/` for company-only (e.g. /jobs/blinkit/).
 * `/jobs/{location}/` for place-only. Otherwise query params.
 */
export function jobsSearchHref(input: JobsSearchTarget) {
  const location = clean(input.location);
  const company = clean(input.company);
  const category = clean(input.category);
  const radius = clean(input.radius);
  const city = clean(input.city);
  const citySlug = clean(input.citySlug);

  if (location && company && !category) {
    const base = `/jobs/${jobsPathSegment(location)}/${jobsPathSegment(company)}/`;
    if (radius) return `${base}?radius=${encodeURIComponent(radius)}`;
    return base;
  }

  if (company && !location && !category) {
    const base = `/jobs/${jobsPathSegment(company)}/`;
    if (radius) return `${base}?radius=${encodeURIComponent(radius)}`;
    return base;
  }

  const params = new URLSearchParams();
  if (company) params.set("company", company);
  if (category) params.set("category", category);
  if (radius) params.set("radius", radius);
  if (city) params.set("city", city);
  if (citySlug) params.set("citySlug", citySlug);

  // Location-only (city or pincode) uses the path segment.
  if (location && !company && !category) {
    const base = `/jobs/${jobsPathSegment(location)}/`;
    if (radius) return `${base}?radius=${encodeURIComponent(radius)}`;
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  if (location) params.set("location", location);
  const qs = params.toString();
  return qs ? `/jobs/?${qs}` : "/jobs/";
}
