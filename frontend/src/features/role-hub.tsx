import { Suspense } from "react";
import { notFound } from "next/navigation";
import Loading from "@/app/loading";
import { SearchResults } from "@/features/job-search";
import { fetchJobsSafe } from "@/lib/services/api-jobs";
import { getLocations } from "@/lib/services/locations";

export async function RoleHubPage({
  location,
  category,
  heading,
}: {
  location: string;
  category: string;
  heading: (label: string) => string;
}) {
  const place = getLocations().find(
    (l) => l.slug === location || l.pincode === location,
  );
  if (!place) notFound();
  const label = /^\d{6}$/.test(location) ? location : place.city;
  const initialJobs = await fetchJobsSafe({
    location: label,
    category,
    sort: "recommended",
  });
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults
        initialLocation={label}
        initialCategory={category}
        initialJobs={initialJobs}
        heading={heading(label)}
      />
    </Suspense>
  );
}
