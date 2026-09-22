import { Suspense } from "react";
import { SearchResults } from "@/features/job-search";
import Loading from "@/app/loading";
export const metadata = { title: "Find Jobs Near You" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults />
    </Suspense>
  );
}
