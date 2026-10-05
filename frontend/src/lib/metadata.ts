import type { Metadata } from "next";
import type { Job } from "@/types";
import { resolvePostedAt } from "@/lib/posted-at";

export const siteOrigin = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://gigkaro.in"
).replace(/\/$/, "");

export const siteName = "GigKaro";

export const ogImage = {
  url: "/images/gigkaro-home-og.jpg",
  width: 1733,
  height: 907,
  alt: "Gig Jobs Near You in India | GigKaro",
};

export const homeFaqs = [
  {
    question: "What is GigKaro?",
    answer:
      "GigKaro is a pincode-level gig hiring network that helps people find and apply for delivery, warehouse, logistics, quick-commerce, EV rider and other gig jobs across India.",
  },
  {
    question: "How can I find gig jobs near me?",
    answer:
      "Enter your pincode, city or location on GigKaro to discover available gig jobs near you.",
  },
  {
    question: "What types of gig jobs are available on GigKaro?",
    answer:
      "GigKaro connects candidates with opportunities such as delivery jobs, warehouse jobs, picker and packer jobs, logistics jobs, quick-commerce jobs, EV rider jobs and field jobs.",
  },
  {
    question: "Does GigKaro offer jobs across India?",
    answer:
      "Yes. GigKaro is designed to connect candidates with gig hiring opportunities across cities, localities and pincodes throughout India.",
  },
  {
    question: "Do I have to pay to apply for jobs on GigKaro?",
    answer:
      "No. Candidates do not pay GigKaro to search for or apply for jobs.",
  },
  {
    question: "Can I find delivery jobs near me on GigKaro?",
    answer:
      "Yes. You can search for delivery opportunities by location or pincode and apply for available jobs in your area.",
  },
  {
    question: "Can I apply for jobs without a CV or resume?",
    answer:
      "Some gig and frontline jobs may not require a traditional CV. Eligibility and application requirements depend on the specific job and employer.",
  },
  {
    question: "How does GigKaro work?",
    answer:
      "Search for a job by location, pincode or category, select a suitable opportunity, submit your application and follow the employer's hiring process.",
  },
] as const;

export const contactOgImage = {
  url: "/images/gigkaro-contact-og.jpg",
  width: 1733,
  height: 907,
  alt: "Contact GigKaro | Gig Jobs & Hiring Support Across India",
};

/** Visible contact FAQ (final copy). */
export const contactFaqs = [
  {
    question: "How can I contact GigKaro?",
    answer:
      "You can contact GigKaro by calling 91803 79173 or by using the contact options available on the GigKaro website.",
  },
  {
    question: "Can I contact GigKaro about a gig job?",
    answer:
      "Yes. Candidates can contact GigKaro for assistance related to gig and frontline job opportunities available through the platform.",
  },
  {
    question: "Can employers contact GigKaro for hiring?",
    answer:
      "Yes. Employers can contact GigKaro to discuss gig and frontline hiring requirements and local candidate sourcing.",
  },
  {
    question: "Does GigKaro charge candidates for job applications?",
    answer:
      "No. Candidates do not pay GigKaro to search for or apply for jobs.",
  },
  {
    question: "Where does GigKaro provide hiring opportunities?",
    answer:
      "GigKaro connects candidates and employers for gig and frontline hiring opportunities across India.",
  },
  {
    question: "What types of jobs can I find through GigKaro?",
    answer:
      "GigKaro helps candidates discover opportunities including delivery, warehouse, logistics, quick-commerce, EV rider, field and other gig jobs.",
  },
  {
    question: "Can I contact GigKaro about an application issue?",
    answer:
      "Yes. Candidates can contact GigKaro for assistance regarding their application or hiring process, subject to the information available for the specific opportunity.",
  },
  {
    question: "Can I contact GigKaro if I am an employer looking for workers?",
    answer:
      "Yes. Employers can contact GigKaro to discuss their hiring requirements and access candidates for gig and frontline roles.",
  },
  {
    question: "Does GigKaro operate across India?",
    answer:
      "Yes. GigKaro is designed to support gig and frontline hiring across cities, localities and pincodes throughout India.",
  },
  {
    question: "How do I apply for jobs listed on GigKaro?",
    answer:
      "Search for a suitable job by location, pincode or category, review the opportunity details and follow the application process provided for that job.",
  },
] as const;

/** FAQ entities included in the contact page JSON-LD graph. */
export const contactSchemaFaqs = [
  {
    question: "How can I contact GigKaro?",
    answer:
      "You can contact GigKaro by calling +91 91803 79173 or by using the contact options available on the GigKaro website.",
  },
  {
    question: "Can I contact GigKaro about a gig job?",
    answer:
      "Yes. Candidates can contact GigKaro for assistance related to gig and frontline job opportunities available through the platform.",
  },
  {
    question: "Can employers contact GigKaro for hiring?",
    answer:
      "Yes. Employers can contact GigKaro to discuss gig and frontline hiring requirements and local candidate sourcing.",
  },
  {
    question: "Does GigKaro charge candidates for job applications?",
    answer:
      "No. Candidates do not pay GigKaro to search for or apply for jobs.",
  },
  {
    question: "Where does GigKaro provide hiring opportunities?",
    answer:
      "GigKaro is designed to connect candidates and employers for gig and frontline hiring opportunities across India.",
  },
  {
    question: "What types of jobs can I find through GigKaro?",
    answer:
      "GigKaro helps candidates discover opportunities including delivery, warehouse, logistics, quick-commerce, EV rider, field and other gig jobs.",
  },
] as const;

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
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
    robots: { index: true, follow: true },
  };
}
const employmentTypeMap: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Flexible: "OTHER",
};

export function jobPostingSchema(job: Job) {
  const posted = resolvePostedAt(job.id, job.postedAt).iso;
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    url: canonicalUrl(`/job/${job.slug}`),
    directApply: true,
    datePosted: posted,
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
        "@id": `${siteOrigin}/#organization`,
        name: siteName,
        legalName: "Victa EarlyJobs Technologies Private Limited",
        url: `${siteOrigin}/`,
        telephone: "+919180379173",
        founder: {
          "@type": "Person",
          "@id": `${siteOrigin}/#founder`,
          name: "Saurav Kumar",
          url: "https://www.linkedin.com/in/mesauravkumar/",
          jobTitle: "Founder",
        },
        parentOrganization: {
          "@type": "Organization",
          name: "EarlyJobs AI",
          url: "https://www.earlyjobs.ai/",
        },
        sameAs: [
          "https://www.linkedin.com/company/gigkaro/",
          "https://www.instagram.com/gigkaro",
          "https://www.youtube.com/@GigKaro",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+919180379173",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteOrigin}/#website`,
        url: `${siteOrigin}/`,
        name: siteName,
        publisher: { "@id": `${siteOrigin}/#organization` },
        inLanguage: "en-IN",
      },
    ],
  };
}

/** Full homepage graph matching the SEO pack (Organization + WebSite + WebPage). */
export function homeGraphSchema() {
  const base = siteSchema();
  return {
    ...base,
    "@graph": [
      ...base["@graph"],
      {
        "@type": "WebPage",
        "@id": `${siteOrigin}/#webpage`,
        url: `${siteOrigin}/`,
        name: "Gig Jobs Near You in India | Delivery, Warehouse & More | GigKaro",
        description:
          "Find gig jobs near you across India. Apply for delivery, warehouse, logistics, quick-commerce, EV rider and other local jobs by pincode.",
        isPartOf: { "@id": `${siteOrigin}/#website` },
        about: { "@id": `${siteOrigin}/#organization` },
        inLanguage: "en-IN",
      },
    ],
  };
}

/** Contact page graph: ContactPage + BreadcrumbList + FAQPage. */
export function contactGraphSchema() {
  const url = canonicalUrl("/contact");
  const base = siteSchema();
  return {
    ...base,
    "@graph": [
      ...base["@graph"],
      {
        "@type": "ContactPage",
        "@id": `${url}#webpage`,
        url,
        name: "Contact GigKaro | Gig Jobs & Hiring Support Across India",
        description:
          "Contact GigKaro for gig job opportunities, employer hiring support and general assistance across India.",
        isPartOf: { "@id": `${siteOrigin}/#website` },
        about: { "@id": `${siteOrigin}/#organization` },
        mainEntity: { "@id": `${siteOrigin}/#organization` },
        inLanguage: "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteOrigin}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Contact GigKaro",
            item: url,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: contactSchemaFaqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}
