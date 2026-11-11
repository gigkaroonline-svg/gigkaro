import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityPage } from "@/features/city-page";
import {
  breadcrumbSchema,
  metaDescription,
  pageMetadata,
} from "@/lib/metadata";
import { fetchJobs } from "@/lib/services/api-jobs";
import {
  cityHubPath,
  citySeoBlurb,
  getCityBySlug,
  getCityLocalitiesCatalog,
  isPhase1City,
} from "@/lib/services/locations";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getCityLocalitiesCatalog().map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) {
    return {
      title: "City not found",
      robots: { index: false, follow: false },
    };
  }
  let jobCount = 0;
  let localPinnedCount = 0;
  try {
    const jobs = await fetchJobs({ location: city.name });
    jobCount = jobs.length;
    // showEverywhere roles inflate every city — only count city-pinned inventory
    // when deciding whether a non-phase-1 hub deserves indexing.
    const cityKey = city.name.trim().toLowerCase();
    localPinnedCount = jobs.filter(
      (job) =>
        !job.showEverywhere &&
        (job.city || "").trim().toLowerCase().includes(cityKey),
    ).length;
  } catch {
    jobCount = 0;
    localPinnedCount = 0;
  }
  const title = `Gig Jobs in ${city.name}`;
  const description = metaDescription(
    jobCount
      ? `${jobCount} open gig roles in ${city.name}. ${citySeoBlurb(city)}`
      : citySeoBlurb(city),
  );
  const indexable = isPhase1City(city.slug) || localPinnedCount > 0;
  return {
    ...pageMetadata(title, description, cityHubPath(city.slug)),
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Locations", path: "/locations" },
              { name: city.name, path: cityHubPath(city.slug) },
            ]),
          ),
        }}
      />
      <CityPage city={city} />
    </>
  );
}
