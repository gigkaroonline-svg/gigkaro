export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const r = Math.PI / 180;
  const x = (b.lat - a.lat) * r;
  const y = (b.lng - a.lng) * r;
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

export type JobLike = {
  _id: { toString(): string };
  slug: string;
  title: string;
  company: string;
  companyId: string;
  initials: string;
  color: string;
  category: string;
  city: string;
  locality: string;
  pincode: string;
  lat: number;
  lng: number;
  distanceKm: number;
  salaryMin: number;
  salaryMax: number;
  salaryType: string;
  incentiveMax: number;
  openings: number;
  immediateJoining: boolean;
  vehicle: string;
  verified: boolean;
  employmentType: string;
  shift: string;
  postedAt: string;
  description: string;
  requirements: string[];
  status?: string;
  jobKey?: string;
  showEverywhere?: boolean;
};

export function serializeJob(
  job: JobLike,
  extras?: {
    distanceKm?: number;
    distanceFromSearch?: boolean;
    locality?: string;
    city?: string;
    pincode?: string;
    lat?: number;
    lng?: number;
    slug?: string;
    logo?: string;
  },
) {
  return {
    id: job._id.toString(),
    slug: extras?.slug ?? job.slug,
    title: job.title,
    company: job.company,
    companyId: job.companyId,
    companyLogo: extras?.logo ?? "",
    initials: job.initials,
    color: job.color,
    category: job.category,
    city: extras?.city ?? job.city,
    locality: extras?.locality ?? job.locality,
    pincode: extras?.pincode ?? job.pincode,
    lat: extras?.lat ?? job.lat,
    lng: extras?.lng ?? job.lng,
    distanceKm: extras?.distanceKm ?? job.distanceKm,
    distanceFromSearch: extras?.distanceFromSearch,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryType: job.salaryType,
    incentiveMax: job.incentiveMax,
    openings: job.openings,
    immediateJoining: job.immediateJoining,
    vehicle: job.vehicle,
    verified: job.verified,
    employmentType: job.employmentType,
    shift: job.shift,
    postedAt: job.postedAt,
    description: job.description,
    requirements: job.requirements,
    status: job.status ?? "Active",
    showEverywhere: !!job.showEverywhere,
  };
}

export function slugForPlace(slug: string, storedPin: string, placePin: string) {
  if (!storedPin || !placePin || storedPin === placePin) return slug;
  const needle = `-${storedPin}`;
  const at = slug.indexOf(needle);
  if (at < 0) return slug;
  return `${slug.slice(0, at)}-${placePin}${slug.slice(at + needle.length)}`;
}
