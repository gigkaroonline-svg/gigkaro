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
  { key: "xpress-bees", name: "Xpress Bees" },
  { key: "loadshare", name: "Loadshare" },
  { key: "zippee", name: "Zippee" },
  { key: "pronto", name: "Pronto" },
  { key: "everest-fleet", name: "Everest Fleet" },
  { key: "snabbit", name: "Snabbit" },
  { key: "blinkit-picker-packer", name: "Blinkit Picker Packer" },
];

const KEYWORD_CATEGORIES: { id: string; name: string }[] = [
  { id: "delivery", name: "Delivery" },
  { id: "warehouse", name: "Warehouse" },
  { id: "logistics", name: "Logistics" },
  { id: "field", name: "Field" },
  { id: "telecaller", name: "Telecaller" },
  { id: "construction", name: "Construction" },
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
    label: "Xpress Bees jobs in Mumbai",
    company: "xpress-bees",
    location: "Mumbai",
  },
  {
    label: "Loadshare jobs in Delhi",
    company: "loadshare",
    location: "Delhi",
  },
  { label: "Zippee jobs in Hyderabad", company: "zippee", location: "Hyderabad" },
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
  const params = new URLSearchParams({ location: keyword.location });
  if (keyword.company) params.set("company", keyword.company);
  if (keyword.category) params.set("category", keyword.category);
  return `/jobs/?${params.toString()}`;
}

function cityDisplayName(slug: string, catalogName: string) {
  return CITY_SEARCH_LABEL[slug] || catalogName;
}

/** Build company × city keywords for a selected city hub. */
export function keywordsForCity(slug: string): FooterKeyword[] {
  const city = getCityBySlug(slug);
  if (!city) return [];
  const location = cityDisplayName(city.slug, city.name);
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
  return [...companyKeywords, ...categoryKeywords].slice(0, 20);
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
