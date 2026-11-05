import type { Metadata } from "next";
import { JobSlugPage, loadPublicJob } from "@/features/job-slug-page";
import { JobPage } from "@/features/job-page";
import {
  decodeJobPlaceSegment,
  jobPlaceDisplayName,
  slugWithoutPincode,
} from "@/lib/job-url";
import { jobPageMetadata } from "@/lib/metadata";
import { fetchPublicJobs } from "@/lib/services/api-jobs";
import { getCityBySlug, slugifyPlace } from "@/lib/services/locations";
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
/** Place URLs must be routable for client navigations; keep their render cheap. */
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

function placeLabels(citySeg: string, localitySeg = "") {
  const city = citySeg ? jobPlaceDisplayName(citySeg, "city") : "";
  const locality = localitySeg
    ? jobPlaceDisplayName(localitySeg, "locality", citySeg)
    : "";
  return { city, locality };
}

/** City/place segments must not trigger a full jobs-list pinless fallback. */
function looksLikeJobSlug(segment: string) {
  const key = slugifyPlace(segment);
  if (!key) return false;
  if (getCityBySlug(key)) return false;
  // Job slugs are hyphenated role ids; bare city tokens are not.
  return key.includes("-");
}

async function resolveParts(parts?: string[]): Promise<Resolved | null> {
  const segs = decodeParts(parts);
  if (!segs.length) return null;

  // Canonical: /job/{slug}
  if (segs.length === 1) {
    const job = (await loadPublicJob(segs[0])) || null;
    return { slug: segs[0], city: "", locality: "", job };
  }

  // Preferred place-first paths when the first segment is a city/place token.
  if (!looksLikeJobSlug(segs[0])) {
    if (segs.length === 2) {
      const job = (await loadPublicJob(segs[1])) || null;
      const labels = placeLabels(segs[0]);
      return { slug: segs[1], city: labels.city, locality: "", job };
    }
    const job = (await loadPublicJob(segs[segs.length - 1])) || null;
    const labels = placeLabels(segs[0], segs[1] || "");
    return {
      slug: segs[segs.length - 1],
      city: labels.city,
      locality: labels.locality,
      job,
    };
  }

  // Legacy slug-first: /job/{slug}/{city}[/{locality}]
  const legacyJob = (await loadPublicJob(segs[0])) || null;
  if (legacyJob) {
    const labels = placeLabels(segs[1] || "", segs[2] || "");
    return {
      slug: segs[0],
      city: labels.city,
      locality: labels.locality,
      job: legacyJob,
    };
  }

  // Fallback: treat as place-first even if the city slug looked hyphenated.
  if (segs.length === 2) {
    const job = (await loadPublicJob(segs[1])) || null;
    const labels = placeLabels(segs[0]);
    return { slug: segs[1], city: labels.city, locality: "", job };
  }
  const job = (await loadPublicJob(segs[segs.length - 1])) || null;
  const labels = placeLabels(segs[0], segs[1] || "");
  return {
    slug: segs[segs.length - 1],
    city: labels.city,
    locality: labels.locality,
    job,
  };
}

function placeMetaFromParts(parts?: string[]): Metadata {
  const segs = decodeParts(parts);
  if (segs.length < 2) {
    return { title: "Job", robots: { index: false, follow: false } };
  }
  const slug = looksLikeJobSlug(segs[0]) ? segs[0] : segs[segs.length - 1];
  const labels = looksLikeJobSlug(segs[0])
    ? placeLabels(segs[1] || "", segs[2] || "")
    : placeLabels(segs[0], segs[1] || "");
  const place = [labels.locality, labels.city].filter(Boolean).join(", ");
  return {
    title: place ? `Job in ${place}` : "Job",
    robots: { index: false, follow: true },
    alternates: slug ? { canonical: `/job/${slug}/` } : undefined,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { parts } = await params;
    // Place URLs stay fetch-free in metadata so Vercel SSR cannot time out.
    if ((parts?.length || 0) > 1) return placeMetaFromParts(parts);

    const resolved = await resolveParts(parts);
    if (!resolved?.job) {
      return {
        title: "Job",
        robots: { index: false, follow: false },
      };
    }
    return jobPageMetadata(resolved.job, {
      placeVariant: Boolean(resolved.city || resolved.locality),
    });
  } catch {
    return {
      title: "Job",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: PageProps) {
  try {
    const { parts } = await params;
    // Multi-segment place URLs: client JobPage only (no API during SSR).
    // Avoids Vercel timeouts and keeps App Router client navigations working.
    if ((parts?.length || 0) > 1) return <JobPage />;

    const resolved = await resolveParts(parts);
    if (!resolved) return <JobPage />;

    return (
      <JobSlugPage
        slug={resolved.slug}
        placeCity={resolved.city}
        placeLocality={resolved.locality}
      />
    );
  } catch {
    return <JobPage />;
  }
}
