/** Build public /jobs search URLs. Prefer path form when location + company. */

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

/**
 * `/jobs/{location}/{company}/` when both are set.
 * Otherwise `/jobs/` or `/jobs/{pincode}/` with query params for the rest.
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
