import { Suspense } from "react";
import { SearchResults } from "@/features/job-search";
import Loading from "@/app/loading";
import { fetchJobsSafe } from "@/lib/services/api-jobs";
import {
  decodeJobsPathSegment,
  jobsSearchHref,
} from "@/lib/jobs-search-url";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = true;

function companyLabel(key: string) {
  return key
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string; company: string }>;
}) {
  const { location: rawLocation, company: rawCompany } = await params;
  const location = decodeJobsPathSegment(rawLocation);
  const company = decodeJobsPathSegment(rawCompany);
  const brand = companyLabel(company);
  return pageMetadata(
    `${brand} Jobs in ${location}`,
    `Find ${brand} gig openings near ${location}. Apply free on GigKaro.`,
    jobsSearchHref({ location, company }),
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ location: string; company: string }>;
}) {
  const { location: rawLocation, company: rawCompany } = await params;
  const location = decodeJobsPathSegment(rawLocation);
  const company = decodeJobsPathSegment(rawCompany);
  const brand = companyLabel(company);
  const initialJobs = await fetchJobsSafe({
    location,
    company,
    sort: "recommended",
  });
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults
        initialLocation={location}
        initialCompany={company}
        initialJobs={initialJobs}
        heading={`${brand} jobs in ${location}`}
      />
    </Suspense>
  );
}
