import type { Metadata } from "next";
import { JobPage } from "@/features/job-page";
import { noindex } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Job",
  ...noindex,
};

export default function Page() {
  return <JobPage />;
}
