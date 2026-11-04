import type { Metadata } from "next";
import { JobSlugPage, loadPublicJob } from "@/features/job-slug-page";
import { JobPage } from "@/features/job-page";
import { jobPageMetadata } from "@/lib/metadata";
import { slugWithoutPincode } from "@/lib/job-url";
import { fetchPublicJobs } from "@/lib/services/api-jobs";

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const job = await loadPublicJob(slug);
    if (!job) {
      return {
        title: job === null ? "Job not found" : "Job",
        robots: { index: false, follow: false },
      };
    }
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
    return <JobSlugPage slug={slug} />;
  } catch {
    return <JobPage />;
  }
}
