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
    "Field Jobs in " + location,
    "Find local field opportunities with clear earnings.",
    "/field-jobs/" + location,
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
      category="field"
      heading={(label) => `Field jobs in ${label}`}
    />
  );
}
