import type { Job, SearchFilters } from "@/types";
import { api } from "@/lib/api";

export async function fetchJobs(filters: SearchFilters & { sort?: string } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || value === false) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  const data = await api<{ jobs: Job[] }>(`/jobs${qs ? `?${qs}` : ""}`, {
    auth: false,
  });
  return data.jobs;
}

export async function fetchPublicJob(slug: string) {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
  ).replace(/\/$/, "");
  const res = await fetch(`${base}/jobs/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not load job.");
  const data = (await res.json()) as { job?: Job };
  return data.job ?? null;
}

export async function fetchJobBySlug(slug: string) {
  const data = await api<{ job: Job }>(`/jobs/${encodeURIComponent(slug)}`, {
    auth: false,
  });
  return data.job;
}

export async function fetchJobsByPincode(pincode: string) {
  const data = await api<{ jobs: Job[] }>(
    `/jobs/pincode/${encodeURIComponent(pincode)}`,
    { auth: false },
  );
  return data.jobs;
}
