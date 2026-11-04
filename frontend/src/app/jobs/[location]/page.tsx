import { Suspense } from "react";
import { SearchResults } from "@/features/job-search";
import Loading from "@/app/loading";
import { decodeJobsPathSegment } from "@/lib/jobs-search-url";
import { pageMetadata } from "@/lib/metadata";

/** Unknown paths fall back to /jobs/ via rewrite (Vercel SSR of these 500s). */
export const dynamicParams = false;
export function generateStaticParams() {
  return [] as { location: string }[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location: raw } = await params;
  const location = decodeJobsPathSegment(raw);
  return pageMetadata(
    `Gig Jobs in ${location}`,
    `Explore delivery, warehouse and field jobs near ${location}.`,
    `/jobs/${encodeURIComponent(location)}`,
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location: raw } = await params;
  const location = decodeJobsPathSegment(raw);
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults
        initialLocation={location}
        heading={`Gig jobs in ${location}`}
      />
    </Suspense>
  );
}
