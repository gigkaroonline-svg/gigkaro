import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/features/job-search";
import Loading from "@/app/loading";
import { pageMetadata } from "@/lib/metadata";
import {
  cityHubPath,
  getCityBySlug,
  localityHubPath,
  slugifyPlace,
} from "@/lib/services/locations";

type Search = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search;
}): Promise<Metadata> {
  const params = await searchParams;
  const location = one(params.location);
  const citySlug = one(params.citySlug);

  if (citySlug) {
    const city = getCityBySlug(citySlug);
    if (city && location) {
      const locality =
        city.localities.find(
          (name) =>
            name.toLowerCase() === location.toLowerCase() ||
            slugifyPlace(name) === slugifyPlace(location),
        ) || location;
      return {
        ...pageMetadata(
          `Jobs near ${locality}`,
          `Browse gig jobs near ${locality}, ${city.name}.`,
          localityHubPath(city.slug, locality),
        ),
        robots: { index: false, follow: true },
      };
    }
    if (city) {
      return {
        ...pageMetadata(
          `Jobs in ${city.name}`,
          `Browse gig jobs in ${city.name}.`,
          cityHubPath(city.slug),
        ),
        robots: { index: false, follow: true },
      };
    }
  }

  if (location) {
    const city = getCityBySlug(slugifyPlace(location));
    if (city) {
      return {
        ...pageMetadata(
          `Jobs in ${city.name}`,
          `Browse gig jobs in ${city.name}.`,
          cityHubPath(city.slug),
        ),
        robots: { index: false, follow: true },
      };
    }
  }

  return pageMetadata(
    "Find Jobs Near You",
    "Search open gig jobs by pincode, city, pay and role. Delivery, warehouse, logistics and field work.",
    "/jobs",
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults />
    </Suspense>
  );
}
