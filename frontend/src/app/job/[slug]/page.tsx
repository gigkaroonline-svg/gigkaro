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

function one(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

export async function generateStaticParams() {
  try {
    const jobs = await fetchPublicJobs();
    const slugs = new Set<string>();
    for (const job of jobs) {
      if (!job.slug) continue;
      slugs.add(job.slug);
      if (job.showEverywhere) slugs.add(slugWithoutPincode(job.slug));
    }
    return [...slugs].map((slug) => ({ slug }));
  } catch {
    return [];
  }
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
  searchParams,
}: PageProps): Promise<Metadata> {
  try {
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
  } catch {
    return {
      title: "Job",
      robots: { index: false, follow: false },
    };
  }
}

function withPlaceFromQuery(
  job: Job,
  query: Record<string, string | string[] | undefined>,
): Job {
  const city = one(query.city);
  const locality = one(query.locality);
  if (!(city || locality)) return job;
  return {
    ...job,
    city: city || job.city,
    locality: locality || "",
    // Location is carried in ?city=&locality= — never surface seed pincode here.
    pincode: "",
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  try {
    const { slug } = await params;
    if (!slug) return <JobPage />;

    const job = await loadJob(slug);
    if (job === null) notFound();
    if (!job) return <JobPage />;

    const query = searchParams ? await searchParams : {};
    const displayJob = withPlaceFromQuery(job, query);

    let nearby: Job[] = [];
    try {
      nearby = relatedJobsFor(job, await fetchPublicJobs()).nearby;
    } catch {
      nearby = [];
    }

    const path = jobCanonicalPath(job);
    let postingJson = "";
    let breadcrumbJson = "";
    let faqJson = "";
    try {
      postingJson = JSON.stringify(jobPostingSchema(displayJob));
      breadcrumbJson = JSON.stringify(
        breadcrumbSchema([
          { name: "Find jobs", path: "/jobs" },
          ...(displayJob.city
            ? [{ name: displayJob.city, path: cityPathForJob(displayJob.city) }]
            : []),
          { name: displayJob.title, path },
        ]),
      );
      faqJson = JSON.stringify(faqSchema(jobFaqItems(displayJob)));
    } catch {
      // Schema is best-effort — never take down the job page.
    }

    return (
      <>
        {postingJson ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: postingJson }}
          />
        ) : null}
        {breadcrumbJson ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: breadcrumbJson }}
          />
        ) : null}
        {faqJson ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: faqJson }}
          />
        ) : null}
        <Suspense fallback={null}>
          <JobDetail job={displayJob} nearby={nearby} />
        </Suspense>
      </>
    );
  } catch {
    // Last resort: client JobPage still hydrates from the API in the browser.
    return <JobPage />;
  }
}
