import type { Metadata } from "next";
import { Suspense } from "react";
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
};

export const revalidate = 60;
export const dynamicParams = true;

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
}: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const job = await loadJob(slug);
    if (!job) {
      return {
        title: job === null ? "Job not found" : "Job",
        robots: { index: false, follow: false },
      };
    }
    // Place variants (?city=&locality=) stay noindex via robots on the client
    // path; avoid awaiting searchParams here — that 500s this route on Vercel.
    return jobPageMetadata(job);
  } catch {
    return {
      title: "Job",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: PageProps) {
  try {
    const { slug } = await params;
    if (!slug) return <JobPage />;

    const job = await loadJob(slug);
    // Client JobPage can still resolve pinless slugs if SSR misses.
    if (!job) return <JobPage />;

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
      postingJson = JSON.stringify(jobPostingSchema(job));
      breadcrumbJson = JSON.stringify(
        breadcrumbSchema([
          { name: "Find jobs", path: "/jobs" },
          ...(job.city
            ? [{ name: job.city, path: cityPathForJob(job.city) }]
            : []),
          { name: job.title, path },
        ]),
      );
      faqJson = JSON.stringify(faqSchema(jobFaqItems(job)));
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
          {/* JobDetail reads ?city=&locality= from the URL on the client. */}
          <JobDetail job={job} nearby={nearby} />
        </Suspense>
      </>
    );
  } catch {
    return <JobPage />;
  }
}
