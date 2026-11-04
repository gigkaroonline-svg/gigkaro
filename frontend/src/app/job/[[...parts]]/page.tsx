import type { Metadata } from "next";
import { JobSlugPage, loadPublicJob } from "@/features/job-slug-page";
import { JobPage } from "@/features/job-page";
import { decodeJobPlaceSegment, slugWithoutPincode } from "@/lib/job-url";
import { jobPageMetadata } from "@/lib/metadata";
import { fetchPublicJobs } from "@/lib/services/api-jobs";
import type { Job } from "@/types";

type PageProps = {
  params: Promise<{ parts?: string[] }>;
};

type Resolved = {
  slug: string;
  city: string;
  locality: string;
  job: Job | null;
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
    return [...slugs].map((slug) => ({ parts: [slug] }));
  } catch {
    return [];
  }
}

function decodeParts(parts?: string[]) {
  return (parts || [])
    .map((part) => decodeJobPlaceSegment(part).trim())
    .filter(Boolean);
}

async function resolveParts(parts?: string[]): Promise<Resolved | null> {
  const segs = decodeParts(parts);
  if (!segs.length) return null;

  // Canonical: /job/{slug}
  if (segs.length === 1) {
    const job = (await loadPublicJob(segs[0])) || null;
    return { slug: segs[0], city: "", locality: "", job };
  }

  // Legacy slug-first: /job/{slug}/{city}[/{locality}]
  // Detect when the first segment is an actual job slug.
  const legacyJob = await loadPublicJob(segs[0]);
  if (legacyJob) {
    return {
      slug: segs[0],
      city: segs[1] || "",
      locality: segs[2] || "",
      job: legacyJob,
    };
  }

  // Preferred: /job/{city}/{slug} or /job/{city}/{locality}/{slug}
  if (segs.length === 2) {
    const job = (await loadPublicJob(segs[1])) || null;
    return { slug: segs[1], city: segs[0], locality: "", job };
  }

  const job = (await loadPublicJob(segs[2])) || null;
  return {
    slug: segs[2],
    city: segs[0],
    locality: segs[1],
    job,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { parts } = await params;
    const resolved = await resolveParts(parts);
    if (!resolved?.job) {
      return {
        title: "Job",
        robots: { index: false, follow: false },
      };
    }
    const meta = jobPageMetadata(resolved.job);
    if (resolved.city || resolved.locality) {
      const place = [resolved.locality, resolved.city].filter(Boolean).join(", ");
      return {
        ...meta,
        robots: { index: false, follow: true },
        title: place ? `${resolved.job.title} in ${place}` : meta.title,
      };
    }
    return meta;
  } catch {
    return {
      title: "Job",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { parts } = await params;
  const resolved = await resolveParts(parts);
  if (!resolved) return <JobPage />;

  return (
    <JobSlugPage
      slug={resolved.slug}
      placeCity={resolved.city}
      placeLocality={resolved.locality}
    />
  );
}
