import { notFound } from "next/navigation";
import { getJobs, getJobBySlug } from "@/lib/services/jobs";
import { JobDetail } from "@/features/job-detail";
import type { Job } from "@/types";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:5000/api";

async function loadJob(slug: string): Promise<Job | null> {
  try {
    const res = await fetch(`${apiBase}/jobs/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { job: Job };
      return data.job;
    }
  } catch {
    // fall through to local catalog
  }
  return getJobBySlug(slug) ?? null;
}

export function generateStaticParams() {
  return getJobs().map((j) => ({ slug: j.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await loadJob(slug);
  return {
    title: job
      ? `${job.title} in ${job.locality} — ₹${job.salaryMin / 1000}k–₹${job.salaryMax / 1000}k`
      : "Job not found",
    description: job?.description,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (!job) notFound();
  return <JobDetail job={job} />;
}
