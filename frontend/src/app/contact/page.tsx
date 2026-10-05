import type { Metadata } from "next";
import { InfoPage } from "@/features/info";
import {
  canonicalUrl,
  contactGraphSchema,
  contactOgImage,
  siteName,
} from "@/lib/metadata";

const title = "Contact GigKaro | Gig Jobs & Hiring Support Across India";
const description =
  "Contact GigKaro for gig job opportunities, employer hiring support and general assistance. Reach India's pincode-level gig hiring network.";
const ogDescription =
  "Contact GigKaro for gig jobs, employer hiring support and assistance across India.";
const url = canonicalUrl("/contact");

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: {
    index: true,
    follow: true,
    maxImagePreview: "large",
    maxSnippet: -1,
    maxVideoPreview: -1,
  },
  alternates: {
    canonical: url,
    languages: {
      "en-IN": url,
      "x-default": url,
    },
  },
  openGraph: {
    type: "website",
    siteName,
    title,
    description: ogDescription,
    url,
    images: [contactOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: ogDescription,
    images: [contactOgImage.url],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactGraphSchema()),
        }}
      />
      <InfoPage kind="contact" />
    </>
  );
}
