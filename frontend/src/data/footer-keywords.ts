/** Popular company × city search keywords for the footer SEO strip. */
export type FooterKeyword = {
  label: string;
  company: string;
  location: string;
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
  const params = new URLSearchParams({
    company: keyword.company,
    location: keyword.location,
  });
  return `/jobs/?${params.toString()}`;
}
