import { getLocations } from "@/lib/services/locations";
import { RoleHubPage } from "@/features/role-hub";
import { pageMetadata } from "@/lib/metadata";

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
    "Delivery Jobs in " + location,
    "Find local delivery opportunities with clear earnings.",
    "/delivery-jobs/" + location,
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  return (
    <RoleHubPage
      location={location}
      category="delivery"
      heading={(label) => `Delivery jobs in ${label}`}
    />
  );
}
