import { jobsSearchHref } from "@/lib/jobs-search-url";
import { getCityBySlug } from "@/lib/services/locations";

/** Popular company × city search keywords for the footer SEO strip. */
export type FooterKeyword = {
  label: string;
  company?: string;
  category?: string;
  location: string;
};

const KEYWORD_COMPANIES: { key: string; name: string }[] = [
  { key: "swiggy", name: "Swiggy" },
  { key: "blinkit", name: "Blinkit" },
  { key: "swiggy-instamart", name: "Swiggy Instamart" },
  { key: "zepto", name: "Zepto" },
  { key: "bigbasket", name: "Bigbasket" },
  { key: "porter", name: "Porter" },
  { key: "flipkart-minutes", name: "Flipkart Minutes" },
  { key: "loadshare", name: "Loadshare" },
  { key: "snabbit", name: "Snabbit" },
  { key: "blinkit-picker-packer", name: "Blinkit Picker Packer" },
];

const KEYWORD_CATEGORIES: { id: string; name: string }[] = [
  { id: "delivery", name: "Delivery" },
  { id: "warehouse", name: "Warehouse" },
];

/** Extra delivery search phrases for city hubs (`{city}` → selected city). */
const CITY_DELIVERY_PHRASES: {
  label: (city: string) => string;
  category: string;
}[] = [
  {
    label: () => "delivery boy jobs near me",
    category: "delivery",
  },
  {
    label: (city) => `delivery boy job vacancy in ${city}`,
    category: "delivery",
  },
  {
    label: (city) => `delivery jobs for freshers in ${city}`,
    category: "delivery",
  },
  {
    label: (city) => `part time delivery jobs ${city}`,
    category: "delivery",
  },
  {
    label: (city) => `full time delivery jobs ${city}`,
    category: "delivery",
  },
];

/** Search-friendly city labels for SEO keywords. */
const CITY_SEARCH_LABEL: Record<string, string> = {
  bengaluru: "Bangalore",
  delhi: "Delhi",
  gurgaon: "Gurgaon",
  gurugram: "Gurgaon",
};

export const FOOTER_JOB_KEYWORDS: FooterKeyword[] = [
  { label: "Swiggy jobs in Bangalore", company: "swiggy", location: "Bangalore" },
  { label: "Blinkit jobs in Mumbai", company: "blinkit", location: "Mumbai" },
  {
    label: "Swiggy Instamart jobs in Delhi",
    company: "swiggy-instamart",
    location: "Delhi",
  },
  { label: "Zepto jobs in Hyderabad", company: "zepto", location: "Hyderabad" },
  { label: "Blinkit jobs in Kolkata", company: "blinkit", location: "Kolkata" },
  { label: "Porter jobs in Chennai", company: "porter", location: "Chennai" },
  { label: "Swiggy jobs in Pune", company: "swiggy", location: "Pune" },
  {
    label: "Bigbasket jobs in Ahmedabad",
    company: "bigbasket",
    location: "Ahmedabad",
  },
  {
    label: "Swiggy Instamart jobs in Noida",
    company: "swiggy-instamart",
    location: "Noida",
  },
  { label: "Zepto jobs in Gurgaon", company: "zepto", location: "Gurgaon" },
  {
    label: "Blinkit jobs in Faridabad",
    company: "blinkit",
    location: "Faridabad",
  },
  {
    label: "Bigbasket jobs in Lucknow",
    company: "bigbasket",
    location: "Lucknow",
  },
  {
    label: "Flipkart Minutes jobs in Bangalore",
    company: "flipkart-minutes",
    location: "Bangalore",
  },
  {
    label: "delivery boy jobs near me",
    category: "delivery",
    location: "Bangalore",
  },
  {
    label: "Loadshare jobs in Delhi",
    company: "loadshare",
    location: "Delhi",
  },
  {
    label: "part time delivery jobs bangalore",
    category: "delivery",
    location: "Bangalore",
  },
  { label: "Porter jobs in Pune", company: "porter", location: "Pune" },
  {
    label: "Swiggy Instamart jobs in Chennai",
    company: "swiggy-instamart",
    location: "Chennai",
  },
  { label: "Zepto jobs in Jaipur", company: "zepto", location: "Jaipur" },
  { label: "Blinkit jobs in Indore", company: "blinkit", location: "Indore" },
];

export function footerKeywordHref(keyword: FooterKeyword) {
  return jobsSearchHref({
    location: keyword.location,
    company: keyword.company,
    category: keyword.category,
  });
}

function cityDisplayName(slug: string, catalogName: string) {
  return CITY_SEARCH_LABEL[slug] || catalogName;
}

/** Build company × city keywords for a selected city hub. */
export function keywordsForCity(slug: string): FooterKeyword[] {
  const city = getCityBySlug(slug);
  if (!city) return [];
  const location = cityDisplayName(city.slug, city.name);
  const cityLower = location.toLowerCase();
  const companyKeywords = KEYWORD_COMPANIES.map(({ key, name }) => ({
    label: `${name} jobs in ${location}`,
    company: key,
    location,
  }));
  const categoryKeywords = KEYWORD_CATEGORIES.map(({ id, name }) => ({
    label: `${name} jobs in ${location}`,
    category: id,
    location,
  }));
  const deliveryPhrases = CITY_DELIVERY_PHRASES.map(({ label, category }) => ({
    label: label(cityLower),
    category,
    location,
  }));
  return [...companyKeywords, ...categoryKeywords, ...deliveryPhrases].slice(
    0,
    20,
  );
}

/** Resolve city slug from /locations/[slug] or /locations/[slug]/[locality]. */
export function citySlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/locations\/([^/]+)(?:\/|$)/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]).toLowerCase();
  if (slug === "page") return null;
  return getCityBySlug(slug) ? slug : null;
}

export function footerKeywordsForPath(pathname: string): FooterKeyword[] {
  const slug = citySlugFromPath(pathname);
  if (slug) {
    const cityKeywords = keywordsForCity(slug);
    if (cityKeywords.length) return cityKeywords;
  }
  return FOOTER_JOB_KEYWORDS;
}
