import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SearchResults } from "@/features/job-search";
import Loading from "@/app/loading";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pincode: string }>;
}) {
  const { pincode } = await params;
  return pageMetadata(
    `Gig Jobs in ${pincode}`,
    `Explore delivery, warehouse and field jobs near ${pincode}.`,
    `/jobs/${pincode}`,
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ pincode: string }>;
}) {
  const { pincode } = await params;
  if (!/^\d{6}$/.test(pincode)) notFound();
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults
        initialLocation={pincode}
        heading={`Gig jobs in ${pincode}`}
      />
    </Suspense>
  );
}
