import { getJobs } from "./jobs";
import { getLocationByPincode } from "./locations";
import type { Job, PostedJob } from "@/types";
type State = { postedJobs: PostedJob[]; statuses: Record<string, string> };
export function getAllDemoJobs(state: State): Job[] {
  return [...state.postedJobs.map(postedJobToJob), ...getJobs()];
}
export function getEffectiveJobs(state: State): Job[] {
  return getAllDemoJobs(state).filter((j) => {
    const posted = state.postedJobs.find((p) => p.id === j.id);
    return (state.statuses[j.id] || posted?.status || "Active") === "Active";
  });
}
export function getEffectiveJobStatus(state: State, id: string) {
  return (
    state.statuses[id] ||
    state.postedJobs.find((p) => p.id === id)?.status ||
    "Active"
  );
}
export function jobHref(job: Job) {
  return job.id.startsWith("posted_")
    ? `/job/local?id=${encodeURIComponent(job.id)}`
    : `/job/${job.slug}`;
}
export function postedJobToJob(p: PostedJob): Job {
  const location = getLocationByPincode(p.pincode);
  return {
    id: p.id,
    slug: "local",
    title: p.title,
    company: "Employer",
    companyId: "employer",
    initials: "sb",
    color: "blue",
    category: p.category,
    city: p.city,
    locality: p.locality,
    pincode: p.pincode,
    lat: location?.lat ?? 0,
    lng: location?.lng ?? 0,
    distanceKm: 0,
    salaryMin: p.salaryMin,
    salaryMax: p.salaryMax,
    salaryType: "monthly",
    incentiveMax: Number(p.incentives.replace(/[^\d.]/g, "")) || 0,
    openings: p.openings,
    immediateJoining: p.joining === "Immediately",
    vehicle: p.vehicle as Job["vehicle"],
    verified: true,
    employmentType: p.employmentType as Job["employmentType"],
    shift: p.shift as Job["shift"],
    postedAt: "Today",
    description: p.description,
    requirements: [
      `Experience: ${p.experience}`,
      "Must be at least 18 years old",
      "A smartphone and basic familiarity with the local area",
    ],
  };
}
