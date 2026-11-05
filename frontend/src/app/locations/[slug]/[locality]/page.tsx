import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalityPage } from "@/features/locality-page";
import {
  breadcrumbSchema,
  metaDescription,
  pageMetadata,
} from "@/lib/metadata";
import { isLocalityIndexable } from "@/lib/hub-index";
import { fetchJobs } from "@/lib/services/api-jobs";
import {
  getLocalityInCity,
  getPhase1Cities,
  localityHubPath,
  localitySeoBlurb,
  slugifyPlace,
} from "@/lib/services/locations";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  // Every phase-1 locality must be prerendered: dynamicParams is false so
  // on-demand SSR cannot fill gaps (and city chips link to the full list).
  return getPhase1Cities().flatMap((city) =>
    city.localities.map((locality) => ({
      slug: city.slug,
      locality: slugifyPlace(locality),
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locality: string }>;
}): Promise<Metadata> {
  const { slug, locality: localityParam } = await params;
  const hit = getLocalityInCity(slug, localityParam);
  if (!hit) {
    return {
      title: "Locality not found",
      robots: { index: false, follow: false },
    };
  }
  const { city, locality } = hit;
  let jobs: Awaited<ReturnType<typeof fetchJobs>> = [];
  try {
    jobs = await fetchJobs({ location: locality });
  } catch {
    jobs = [];
  }
  const jobCount = jobs.length;
  const path = localityHubPath(city.slug, locality);
  const title = `Gig Jobs in ${locality}, ${city.name}`;
  const description = metaDescription(
    jobCount
      ? `${jobCount} open gig roles near ${locality}, ${city.name}. ${localitySeoBlurb(city, locality)}`
      : localitySeoBlurb(city, locality),
  );
  // Phase-1 hubs with openings (incl. nationwide) — matches locations sitemap drip.
  const indexable = isLocalityIndexable(jobs, city, locality);
  return {
    ...pageMetadata(title, description, path),
    description,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; locality: string }>;
}) {
  const { slug, locality: localityParam } = await params;
  const hit = getLocalityInCity(slug, localityParam);
  if (!hit) notFound();
  const { city, locality } = hit;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Locations", path: "/locations" },
              { name: city.name, path: `/locations/${city.slug}` },
              {
                name: locality,
                path: localityHubPath(city.slug, locality),
              },
            ]),
          ),
        }}
      />
      <LocalityPage city={city} locality={locality} />
    </>
  );
}
