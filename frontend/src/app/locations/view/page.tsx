import type { Metadata } from "next";
import { LocalityViewPage } from "@/features/locality-view-page";
import { noindex } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Locality jobs",
  ...noindex,
};

export default function Page() {
  return <LocalityViewPage />;
}
