import {
  getPhase1Cities,
  slugifyPlace,
  type CityLocalityEntry,
} from "@/lib/services/locations";
import type { Job } from "@/types";

export type PlaceSlot = { city: string; locality: string };

export function jobHasSpecificLocality(job: Job, cityName: string) {
  // Nationwide roles use a seed locality in the DB; on city hubs they should
  // still expand across every neighbourhood, not stick to that seed.
  if (job.showEverywhere) return false;
  const locality = (job.locality || "").trim();
  return (
    Boolean(locality) &&
    locality.toLowerCase() !== (job.city || "").trim().toLowerCase() &&
    locality.toLowerCase() !== cityName.toLowerCase()
  );
}

export function countLocalityOpenings(jobs: Job[], city: CityLocalityEntry) {
  const localities = city.localities.length ? city.localities : [city.name];
  let total = 0;
  for (const job of jobs) {
    total += jobHasSpecificLocality(job, city.name) ? 1 : localities.length;
  }
  return total;
}

export function placesForCity(city: CityLocalityEntry): PlaceSlot[] {
  const localities = city.localities.length ? city.localities : [city.name];
  return localities.map((locality) => ({ city: city.name, locality }));
}

/** All localities across the 12 primary city hubs. */
export function phase1PlaceSlots(): PlaceSlot[] {
  return getPhase1Cities().flatMap(placesForCity);
}

function splitPinnedAndWide(jobs: Job[], cityName = "") {
  const pinned: Job[] = [];
  const cityWide: Job[] = [];
  for (const job of jobs) {
    if (cityName && jobHasSpecificLocality(job, cityName)) {
      pinned.push({
        ...job,
        city: cityName || job.city,
        locality: (job.locality || "").trim(),
      });
    } else if (!cityName && !job.showEverywhere && jobHasSpecificLocality(job, job.city || "")) {
      pinned.push(job);
    } else {
      cityWide.push(job);
    }
  }
  return { pinned, cityWide };
}

export function expandJobsForLocalities(
  jobs: Job[],
  city: CityLocalityEntry,
): Job[] {
  const places = placesForCity(city);
  const { pinned, cityWide } = splitPinnedAndWide(jobs, city.name);
  const rows: Job[] = [];

  // Locality-first so the first page mixes companies, not one company across
  // every neighbourhood.
  for (const place of places) {
    for (const job of cityWide) {
      rows.push({
        ...job,
        id: `${job.id}__${slugifyPlace(place.city)}__${slugifyPlace(place.locality)}`,
        city: place.city,
        locality: place.locality,
        pincode: "",
      });
    }
  }

  return [...pinned, ...rows];
}

/** Openings for one neighbourhood: keep pinned matches, stamp city-wide roles. */
export function jobsForLocalityPlace(
  jobs: Job[],
  city: CityLocalityEntry,
  locality: string,
): Job[] {
  const placeName = locality.trim();
  if (!placeName) return [];
  const key = placeName.toLowerCase();
  const { pinned, cityWide } = splitPinnedAndWide(jobs, city.name);
  const matchingPinned = pinned.filter(
    (job) => (job.locality || "").trim().toLowerCase() === key,
  );
  const expanded = cityWide.map((job) => ({
    ...job,
    id: `${job.id}__${slugifyPlace(city.name)}__${slugifyPlace(placeName)}`,
    city: city.name,
    locality: placeName,
    pincode: "",
  }));
  return [...matchingPinned, ...expanded];
}

/**
 * Page expanded openings without materialising every row (phase1 can be 3k+ places).
 * Locality-first across `places`, then city-wide jobs.
 */
export function pageExpandedJobs(
  jobs: Job[],
  places: PlaceSlot[],
  page: number,
  pageSize: number,
): { rows: Job[]; total: number } {
  const { pinned, cityWide } = splitPinnedAndWide(jobs);
  const expanded = places.length * cityWide.length;
  const total = pinned.length + expanded;
  if (total === 0) return { rows: [], total: 0 };

  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize;
  if (start >= total) return { rows: [], total };

  const rows: Job[] = [];
  let index = 0;

  for (const job of pinned) {
    if (index >= end) break;
    if (index >= start) rows.push(job);
    index += 1;
  }

  if (index >= end || !cityWide.length || !places.length) {
    return { rows, total };
  }

  // Skip into the expanded matrix: place-major, then job.
  const skip = Math.max(0, start - pinned.length);
  const need = end - Math.max(start, pinned.length);
  let taken = 0;
  let cursor = 0;
  outer: for (const place of places) {
    for (const job of cityWide) {
      if (cursor >= skip) {
        rows.push({
          ...job,
          id: `${job.id}__${slugifyPlace(place.city)}__${slugifyPlace(place.locality)}`,
          city: place.city,
          locality: place.locality,
          pincode: "",
        });
        taken += 1;
        if (taken >= need) break outer;
      }
      cursor += 1;
    }
  }

  return { rows, total };
}
