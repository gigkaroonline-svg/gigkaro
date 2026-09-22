import { jobs } from "@/data/jobs";
import { locations } from "@/data/locations";
import type { SearchFilters, Job } from "@/types";
export function getJobs() {
  return jobs;
}
export function getJobBySlug(slug: string) {
  return jobs.find((job) => job.slug === slug);
}
export function getJobsByPincode(pincode: string) {
  return jobs.filter((job) => job.pincode === pincode);
}
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = Math.PI / 180;
  const x = (b.lat - a.lat) * r,
    y = (b.lng - a.lng) * r;
  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(
        Math.sin(x / 2) ** 2 +
          Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(y / 2) ** 2,
      ),
      Math.sqrt(
        1 -
          (Math.sin(x / 2) ** 2 +
            Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(y / 2) ** 2),
      ),
    )
  );
}
export function searchJobs(f: SearchFilters = {}, source: Job[] = jobs) {
  const q = (f.location ?? "").trim().toLowerCase();
  const origin = locations.find(
    (l) => l.pincode === q || l.locality.toLowerCase() === q,
  );
  const isPin = /^\d+$/.test(q);
  return source
    .map((j) => ({
      ...j,
      distanceFromSearch: !!origin,
      distanceKm: origin
        ? Math.round(distanceKm(origin, j) * 10) / 10
        : j.distanceKm,
    }))
    .filter((j) => {
      if (q) {
        if (origin) {
          if (
            f.radius === "0"
              ? j.pincode !== origin.pincode
              : j.distanceKm > Number(f.radius || 10)
          )
            return false;
        } else if (
          isPin
            ? j.pincode !== q
            : ![j.city, j.locality].some((v) => v.toLowerCase().includes(q)) &&
              !(q === "delhi" && j.city === "Delhi NCR")
        )
          return false;
      }
      if (f.category && j.category !== f.category) return false;
      if (f.salary) {
        const [min, max] = f.salary.split("-").map(Number);
        if (j.salaryMax < min || (max && j.salaryMin > max)) return false;
      }
      return (
        (!f.type || j.employmentType === f.type) &&
        (!f.vehicle || j.vehicle === f.vehicle) &&
        (!f.shift || j.shift === f.shift) &&
        (!f.immediate || j.immediateJoining)
      );
    });
}
