import type { Metadata } from "next";
import { HomePage } from "@/features/home";
import {
  canonicalUrl,
  faqSchema,
  homeFaqs,
  homeGraphSchema,
  ogImage,
  siteName,
} from "@/lib/metadata";

const title = "Find Gig Jobs Near You| Delivery, Warehouse & More | GigKaro";
const description =
  "Find gig jobs near you across India. Apply for delivery, warehouse, logistics, quick-commerce, EV rider and other local jobs by pincode. Free for candidates.";
const ogTitle = "Gig Jobs Near You in India | GigKaro";
const ogDescription =
  "Find delivery, warehouse, logistics, quick-commerce and other gig jobs near your pincode across India.";
const twitterDescription =
  "Find gig jobs near you across India by pincode and location.";
const url = canonicalUrl("/");

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
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
    title: ogTitle,
    description: ogDescription,
    url,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: twitterDescription,
    images: [ogImage.url],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeGraphSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqSchema(homeFaqs.map((item) => ({ ...item }))),
          ),
        }}
      />
      <HomePage />
    </>
  );
}
