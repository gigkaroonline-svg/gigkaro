import { redirect } from "next/navigation";
import { getLocationByPincode, getLocations } from "@/lib/services/locations";
import { PincodePage } from "@/features/discovery";
import { pageMetadata } from "@/lib/metadata";
export function generateStaticParams() {
  return getLocations().map((l) => ({ pincode: l.pincode }));
}
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
  if (!getLocationByPincode(pincode)) {
    redirect(`/jobs?location=${encodeURIComponent(pincode)}`);
  }
  return <PincodePage pincode={pincode} />;
}
