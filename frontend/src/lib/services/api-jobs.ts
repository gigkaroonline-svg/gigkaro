import type { Job, SearchFilters } from "@/types";
import { ApiError, api, publicApiBase } from "@/lib/api";
import { slugWithoutPincode } from "@/lib/job-url";

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

/** Public/SSR job list that never throws — logs failures for ops. */
export async function fetchJobsSafe(
  filters: SearchFilters & { sort?: string } = {},
) {
  try {
    return await fetchJobs(filters);
  } catch (err) {
    console.error("[fetchJobsSafe] jobs request failed", { filters, err });
    return [] as Job[];
  }
}

async function fetchPublicJobsPayload(revalidate = 60) {
  const res = await fetch(`${publicApiBase()}/jobs`, {
    next: { revalidate },
  });
  if (!res.ok) return [] as Job[];
  const data = (await res.json()) as { jobs?: Job[] };
  return data.jobs || [];
}

export async function fetchPublicJobSlugs() {
  try {
    return (await fetchPublicJobsPayload(3600))
      .map((job) => job.slug)
      .filter((slug): slug is string => Boolean(slug));
  } catch {
    return [];
  }
}

export async function fetchPublicJobs() {
  try {
    return await fetchPublicJobsPayload(60);
  } catch {
    return [];
  }
}

export function relatedJobsFor(job: Job, pool: Job[]) {
  const similar = pool
    .filter((row) => row.id !== job.id && row.category === job.category)
    .slice(0, 3);
  const nearby = pool
    .filter(
      (row) =>
        row.id !== job.id &&
        ((job.pincode && row.pincode === job.pincode) ||
          (!job.pincode && row.city === job.city)),
    )
    .slice(0, 3);
  return { similar, nearby };
}

/** Match pinless hub URLs (delivery-partner) to stored seed slugs (*-560034). */
export function findJobBySlugOrPinless(jobs: Job[], slug: string) {
  const key = String(slug || "").trim();
  if (!key) return null;
  const exact = jobs.find((job) => job.slug === key);
  if (exact) return exact;
  const base = slugWithoutPincode(key);
  if (!base) return null;
  return (
    jobs.find(
      (job) =>
        Boolean(job.showEverywhere) &&
        slugWithoutPincode(job.slug || "") === base,
    ) || null
  );
}

export async function fetchPublicJob(slug: string) {
  try {
    const res = await fetch(
      `${publicApiBase()}/jobs/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } },
    );
    if (res.ok) {
      const data = (await res.json()) as { job?: Job };
      return data.job ?? null;
    }
    if (res.status !== 404) throw new Error("Could not load job.");
    // Sitemap/canonicals omit the seed pincode; resolve against the public list
    // when the API has not yet deployed pinless slug lookup.
    const match = findJobBySlugOrPinless(await fetchPublicJobs(), slug);
    return match;
  } catch (err) {
    if (err instanceof Error && err.message === "Could not load job.") throw err;
    throw new Error("Could not load job.");
  }
}

export async function fetchJobBySlug(slug: string) {
  try {
    const data = await api<{ job: Job }>(`/jobs/${encodeURIComponent(slug)}`, {
      auth: false,
    });
    return data.job;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const match = findJobBySlugOrPinless(await fetchJobs(), slug);
      if (match) return match;
    }
    throw err;
  }
}

export async function fetchJobsByPincode(pincode: string) {
  const data = await api<{ jobs: Job[] }>(
    `/jobs/pincode/${encodeURIComponent(pincode)}`,
    { auth: false },
  );
  return data.jobs;
}

export async function fetchPublicJobsByPincode(pincode: string) {
  try {
    const res = await fetch(
      `${publicApiBase()}/jobs/pincode/${encodeURIComponent(pincode)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: Job[] };
    return data.jobs ?? [];
  } catch {
    return [];
  }
}
