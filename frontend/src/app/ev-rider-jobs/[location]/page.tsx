import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLocations } from "@/lib/services/locations";
import { SearchResults } from "@/features/job-search";
import { pageMetadata } from "@/lib/metadata";
import Loading from "@/app/loading";
export function generateStaticParams() {
  return [...new Set(getLocations().flatMap((l) => [l.slug, l.pincode]))].map(
    (location) => ({ location }),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  return pageMetadata(
    "Ev-Rider Jobs in " + location,
    "Find local ev-rider opportunities with clear earnings.",
    "/ev-rider-jobs/" + location,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const place = getLocations().find(
    (l) => l.slug === location || l.pincode === location,
  );
  if (!place) notFound();
  const label = /^\d{6}$/.test(location) ? location : place.city;
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults
        initialLocation={label}
        initialCategory="ev"
        heading={`Ev Rider jobs in ${label}`}
      />
    </Suspense>
  );
}
