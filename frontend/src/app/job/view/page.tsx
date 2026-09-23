import type { Metadata } from "next";
import { JobPage } from "@/features/job-page";

export const metadata: Metadata = {
  title: "Job",
};

export default function Page() {
  return <JobPage />;
}
