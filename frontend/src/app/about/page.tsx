import type { Metadata } from "next";
import { AboutPage } from "@/features/about";
import { pageMetadata } from "@/lib/metadata";

const title = "About GigKaro | Work is local. Hiring should be too.";
const description =
  "GigKaro is India’s pincode-level gig hiring network. We connect businesses with frontline workers nearby and measure success by joinings.";

export const metadata: Metadata = {
  ...pageMetadata(title, description, "/about"),
  title: { absolute: title },
};

export default function Page() {
  return <AboutPage />;
}
