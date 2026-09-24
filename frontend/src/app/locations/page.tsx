import { DiscoveryPage } from "@/features/discovery";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Explore Locations",
  "Browse gig jobs by city and pincode across India.",
  "/locations",
);
export default function Page() {
  return <DiscoveryPage kind="locations" />;
}
