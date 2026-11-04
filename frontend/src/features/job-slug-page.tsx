import { Suspense } from "react";
import { JobDetail } from "@/features/job-detail";
import { JobPage } from "@/features/job-page";
import {
  breadcrumbSchema,
  faqSchema,
  jobPostingSchema,
} from "@/lib/metadata";
import { jobFaqItems } from "@/lib/job-copy";
import { jobCanonicalPath } from "@/lib/job-url";
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

export async function loadPublicJob(slug: string): Promise<Job | null | undefined> {
  try {
    return await fetchPublicJob(slug);
  } catch {
    return undefined;
  }
}

export async function JobSlugPage({
  slug,
  placeCity = "",
  placeLocality = "",
}: {
  slug: string;
  placeCity?: string;
  placeLocality?: string;
}) {
  try {
    if (!slug) return <JobPage />;

    const job = await loadPublicJob(slug);
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
          <JobDetail
            job={job}
            nearby={nearby}
            placeCity={placeCity}
            placeLocality={placeLocality}
          />
        </Suspense>
      </>
    );
  } catch {
    return <JobPage />;
  }
}
