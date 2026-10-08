import { notFound } from "next/navigation";
import { PincodePage } from "@/features/discovery";
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
  return <PincodePage pincode={pincode} />;
}
