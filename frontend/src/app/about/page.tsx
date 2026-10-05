import type { Metadata } from "next";
import { AboutPage } from "@/features/about";
import { pageMetadata } from "@/lib/metadata";

const title = "About GigKaro | India's Pincode-Level Gig Hiring Network";
const description =
  "GigKaro is a pincode-level gig and frontline hiring network built by EarlyJobs. Good work. Closer to home.";

export const metadata: Metadata = {
  ...pageMetadata(title, description, "/about"),
  title: { absolute: title },
};

export default function Page() {
  return <AboutPage />;
}
