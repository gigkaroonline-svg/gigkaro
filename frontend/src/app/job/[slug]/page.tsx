import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobPage } from "@/features/job-page";
import { fetchPublicJob, fetchPublicJobSlugs } from "@/lib/services/api-jobs";
import {
  breadcrumbSchema,
  jobPostingSchema,
  pageMetadata,
} from "@/lib/metadata";
import type { Job } from "@/types";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await fetchPublicJobSlugs();
  return slugs.map((slug) => ({ slug }));
}

async function loadJob(slug: string): Promise<Job | null | undefined> {
  try {
    return await fetchPublicJob(slug);
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (!job) {
    return {
      title: job === null ? "Job not found" : "Job",
      robots: job === null ? { index: false, follow: false } : undefined,
    };
  }
  const pay = `₹${Math.round(job.salaryMin / 1000)}k–₹${Math.round(job.salaryMax / 1000)}k`;
  return pageMetadata(
    `${job.title} in ${job.locality}`,
    `${job.title} at ${job.company} in ${job.locality}, ${job.city}. ${pay} a month. ${job.description}`.slice(
      0,
      160,
    ),
    `/job/${job.slug}`,
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (job === null) notFound();
  const structured = job
    ? [
        jobPostingSchema(job),
        breadcrumbSchema([
          { name: "Find jobs", path: "/jobs" },
          { name: job.title, path: `/job/${job.slug}` },
        ]),
      ]
    : [];
  return (
    <>
      {structured.map((data) => (
        <script
          key={String(data["@type"])}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <JobPage />
    </>
  );
}
