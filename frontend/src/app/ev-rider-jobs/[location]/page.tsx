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
  return (
    <RoleHubPage
      location={location}
      category="ev"
      heading={(label) => `Ev Rider jobs in ${label}`}
    />
  );
}
