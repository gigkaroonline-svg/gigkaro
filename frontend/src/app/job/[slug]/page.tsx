import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { JobDetail } from "@/features/job-detail";
import { JobPage } from "@/features/job-page";
import {
  breadcrumbSchema,
  faqSchema,
  jobPageMetadata,
  jobPostingSchema,
} from "@/lib/metadata";
import { jobFaqItems } from "@/lib/job-copy";
import { jobCanonicalPath, slugWithoutPincode } from "@/lib/job-url";
import {
  fetchPublicJob,
  fetchPublicJobs,
  relatedJobsFor,
} from "@/lib/services/api-jobs";
import { getCityBySlug, slugifyPlace } from "@/lib/services/locations";
import type { Job } from "@/types";

function cityPathForJob(city: string) {
  const normalized = /delhi/i.test(city)
    ? "delhi"
    : slugifyPlace(city.replace(/\s+ncr$/i, ""));
  const hit = getCityBySlug(normalized);
  return hit ? `/locations/${hit.slug}` : "/locations";
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const jobs = await fetchPublicJobs();
  const slugs = new Set<string>();
  for (const job of jobs) {
    if (!job.slug) continue;
    slugs.add(job.slug);
    if (job.showEverywhere) slugs.add(slugWithoutPincode(job.slug));
  }
  return [...slugs].map((slug) => ({ slug }));
}

async function loadJob(slug: string): Promise<Job | null | undefined> {
  try {
    return await fetchPublicJob(slug);
  } catch {
    return undefined;
  }
}

function one(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const placeVariant = Boolean(one(query.city) || one(query.locality));
  const job = await loadJob(slug);
  if (!job) {
    return {
      title: job === null ? "Job not found" : "Job",
      robots: { index: false, follow: false },
    };
  }
  return jobPageMetadata(job, { placeVariant });
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (job === null) notFound();
  if (!job) return <JobPage />;
  const { nearby } = relatedJobsFor(job, await fetchPublicJobs());
  const path = jobCanonicalPath(job);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jobPostingSchema(job)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Find jobs", path: "/jobs" },
              ...(job.city
                ? [{ name: job.city, path: cityPathForJob(job.city) }]
                : []),
              { name: job.title, path },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema(jobFaqItems(job))),
        }}
      />
      <Suspense fallback={null}>
        <JobDetail job={job} nearby={nearby} />
      </Suspense>
    </>
  );
}
