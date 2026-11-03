import {
  getPhase1Cities,
  isPhase1City,
  slugifyPlace,
  type CityLocalityEntry,
} from "@/lib/services/locations";

type PlaceJob = {
  showEverywhere?: boolean;
  city?: string;
  locality?: string;
  pincode?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function cityMatches(jobCity: string, city: CityLocalityEntry) {
  const left = normalize(jobCity);
  const right = normalize(city.name);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  if (city.slug === "delhi" && /delhi/.test(left)) return true;
  return slugifyPlace(jobCity) === city.slug;
}

function localityMatches(jobLocality: string, localityName: string) {
  const left = normalize(jobLocality);
  const right = normalize(localityName);
  if (!left || !right) return false;
  return (
    left === right ||
    left.includes(right) ||
    right.includes(left) ||
    slugifyPlace(jobLocality) === slugifyPlace(localityName)
  );
}

/** Pinned (non-nationwide) jobs that truly belong to this locality. */
export function countPinnedJobsForLocality(
  jobs: PlaceJob[],
  city: CityLocalityEntry,
  localityName: string,
) {
  return jobs.filter((job) => {
    if (job.showEverywhere) return false;
    if (!cityMatches(job.city || "", city)) return false;
    return localityMatches(job.locality || "", localityName);
  }).length;
}

/**
 * Phase-1 locality pages are indexable when they have openings to show
 * (including nationwide showEverywhere inventory that surfaces on the hub).
 */
export function isLocalityIndexable(
  jobs: PlaceJob[],
  city: CityLocalityEntry,
  _localityName: string,
) {
  return isPhase1City(city.slug) && jobs.length > 0;
}

/** Phase-1 locality hubs that have at least one pinned Active job. */
export function indexableLocalityHubs(jobs: PlaceJob[]) {
  const hubs: { citySlug: string; locality: string }[] = [];
  for (const city of getPhase1Cities()) {
    for (const locality of city.localities) {
      if (countPinnedJobsForLocality(jobs, city, locality) > 0) {
        hubs.push({ citySlug: city.slug, locality });
      }
    }
  }
  return hubs;
}

/** Every locality under the major 12 cities (stable city → locality order). */
export function allPhase1LocalityHubs() {
  return getPhase1Cities().flatMap((city) =>
    city.localities.map((locality) => ({
      citySlug: city.slug,
      locality,
    })),
  );
}

export function activeJobPincodes(jobs: PlaceJob[]) {
  return [
    ...new Set(
      jobs
        .map((job) => String(job.pincode || "").trim())
        .filter((pin) => /^\d{6}$/.test(pin)),
    ),
  ];
}

const CATEGORY_SEO_ROOT: Record<string, string> = {
  delivery: "delivery-jobs",
  warehouse: "warehouse-jobs",
  logistics: "logistics-jobs",
  field: "field-jobs",
  ev: "ev-rider-jobs",
};

/** Indexable destination for “similar / nearby jobs” CTAs. */
export function similarJobsPath(job: {
  category?: string;
  city?: string;
  pincode?: string;
}) {
  const pin = String(job.pincode || "").trim();
  if (/^\d{6}$/.test(pin)) return `/jobs/${pin}`;

  const root = CATEGORY_SEO_ROOT[String(job.category || "").trim()];
  const citySlug = job.city
    ? getPhase1Cities().find((city) => cityMatches(job.city || "", city))?.slug
    : undefined;
  if (root && citySlug) return `/${root}/${citySlug}`;
  if (citySlug) return `/locations/${citySlug}`;
  return "/jobs";
}
