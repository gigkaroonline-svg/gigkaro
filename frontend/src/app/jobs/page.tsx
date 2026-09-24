import { Suspense } from "react";
import { SearchResults } from "@/features/job-search";
import Loading from "@/app/loading";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Find Jobs Near You",
  "Search open gig jobs by pincode, city, pay and role. Delivery, warehouse, logistics and field work.",
  "/jobs",
);

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults />
    </Suspense>
  );
}
