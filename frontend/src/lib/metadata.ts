import type { Metadata } from "next";
import type { Job } from "@/types";

export const siteOrigin = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://gigkaro.in"
).replace(/\/$/, "");

export const siteName = "GigKaro";

export function canonicalUrl(path: string) {
  if (!path || path === "/") return `${siteOrigin}/`;
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return `${siteOrigin}${withSlash.startsWith("/") ? withSlash : `/${withSlash}`}`;
}

export const noindex: Metadata = {
  robots: { index: false, follow: false },
};

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = canonicalUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName,
    },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true },
  };
}
const employmentTypeMap: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Flexible: "OTHER",
};

export function jobPostingSchema(job: Job) {
  const posted = /^\d{4}-\d{2}-\d{2}/.test(job.postedAt) ? job.postedAt : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    url: canonicalUrl(`/job/${job.slug}`),
    directApply: true,
    ...(posted ? { datePosted: posted } : {}),
    employmentType: employmentTypeMap[job.employmentType] || "OTHER",
    identifier: {
      "@type": "PropertyValue",
      name: siteName,
      value: job.slug,
    },
    hiringOrganization: { "@type": "Organization", name: job.company },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.locality || job.city,
        addressRegion: job.city,
        postalCode: job.pincode,
        addressCountry: "IN",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "MONTH",
      },
    },
  };
}
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function siteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        url: `${siteOrigin}/`,
        email: "info@gigkaro.in",
        telephone: "+919180379173",
        sameAs: [
          "https://www.linkedin.com/company/gigkaro",
          "https://www.instagram.com/gigkaro",
        ],
      },
      {
        "@type": "WebSite",
        name: siteName,
        url: `${siteOrigin}/`,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteOrigin}/jobs/?location={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
