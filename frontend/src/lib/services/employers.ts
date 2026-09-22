import { employers } from "@/data/employers";
import { getJobs } from "./jobs";
import type { PostedJob } from "@/types";
export const getEmployers = () => employers;
export function getEmployerJobs() {
  return getJobs().filter(
    (j) => j.companyId === "swift" && j.city === "Bengaluru",
  );
}
export const demoApplicants = [
  {
    id: "candidate-1",
    name: "Rahul Kumar",
    location: "Koramangala",
    pincode: "560034",
    category: "delivery",
    job: "Delivery Partner",
    status: "Applied",
    experience: "1 year",
    vehicle: "Bike",
    joined: "2026-09-15",
  },
  {
    id: "candidate-2",
    name: "Ayesha S.",
    location: "BTM Layout",
    pincode: "560029",
    category: "warehouse",
    job: "Warehouse Associate",
    status: "Contacted",
    experience: "Fresher",
    vehicle: "No vehicle",
    joined: "2026-09-14",
  },
  {
    id: "candidate-3",
    name: "Manoj P.",
    location: "HSR Layout",
    pincode: "560102",
    category: "ev",
    job: "EV Delivery Rider",
    status: "Interview",
    experience: "2 years",
    vehicle: "EV",
    joined: "2026-09-13",
  },
  {
    id: "candidate-4",
    name: "Kiran R.",
    location: "Koramangala",
    pincode: "560034",
    category: "delivery",
    job: "Delivery Partner",
    status: "Selected",
    experience: "1 year",
    vehicle: "Bike",
    joined: "2026-09-12",
  },
  {
    id: "candidate-5",
    name: "Priya M.",
    location: "Bommanahalli",
    pincode: "560068",
    category: "field",
    job: "Field Executive",
    status: "Joined",
    experience: "Fresher",
    vehicle: "No vehicle",
    joined: "2026-09-11",
  },
];
export const getDemoApplicants = () => demoApplicants;
export function validatePostedJob(v: Partial<PostedJob>, step: number): string {
  if (
    step === 0 &&
    (!v.title?.trim() ||
      !v.category ||
      !v.openings ||
      !Number.isInteger(v.openings) ||
      v.openings < 1)
  )
    return "Enter a job title, category and a positive whole number of openings.";
  if (
    step === 1 &&
    (!v.state?.trim() ||
      !v.district?.trim() ||
      !v.city?.trim() ||
      !v.locality?.trim() ||
      !v.pincode?.match(/^[1-9]\d{5}$/))
  )
    return "Complete the location and enter a valid 6-digit pincode.";
  if (
    step === 2 &&
    (!v.salaryMin ||
      !v.salaryMax ||
      v.salaryMin < 1 ||
      v.salaryMax < v.salaryMin)
  )
    return "Enter valid earnings. Maximum earnings must be at least the minimum.";
  if (step === 3 && (!v.employmentType || !v.vehicle || !v.shift || !v.joining))
    return "Choose a job type, vehicle requirement, shift and joining timeline.";
  if (step === 4 && (!v.description || v.description.trim().length < 40))
    return "Tell candidates about the work in at least 40 characters.";
  return "";
}

export function getWorkspaceApplicants(
  state: {
    applications: import("@/types").Application[];
    postedJobs: PostedJob[];
    statuses: Record<string, string>;
  },
  employerOnly = false,
) {
  const catalog = [
    ...getJobs(),
    ...state.postedJobs.map((j) => ({
      id: j.id,
      title: j.title,
      pincode: j.pincode,
      companyId: "swift",
      category: j.category,
      locality: j.locality,
    })),
  ];
  const seed = demoApplicants.map((a) => ({
    ...a,
    jobId:
      catalog.find((j) => j.title === a.job && j.pincode === a.pincode)?.id ||
      "",
  }));
  const added = state.applications.map((a) => {
    const job = catalog.find((j) => j.id === a.jobId);
    return {
      id: a.id,
      jobId: a.jobId,
      name: a.name,
      location: job?.locality || a.pincode,
      pincode: a.pincode,
      category: job?.category || "delivery",
      job: job?.title || "Gig role",
      status: a.status,
      experience: "Not specified",
      vehicle: a.bike === "Yes" ? "Bike" : "No vehicle",
      joined: a.createdAt.slice(0, 10),
    };
  });
  return [...seed, ...added]
    .filter(
      (a) =>
        !employerOnly ||
        catalog.find((j) => j.id === a.jobId)?.companyId === "swift",
    )
    .map((a) => ({ ...a, status: state.statuses[a.id] || a.status }));
}
