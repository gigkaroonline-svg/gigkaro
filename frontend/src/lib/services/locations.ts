import catalog from "@/data/city-localities.json";
import { locations } from "@/data/locations";

export type CityLocalityEntry = {
  name: string;
  slug: string;
  localities: string[];
};

/** First-wave city hubs for locality URLs, sitemap depth, and unique copy. */
export const PHASE1_CITY_SLUGS = [
  "bengaluru",
  "delhi",
  "mumbai",
  "hyderabad",
  "chennai",
  "pune",
  "kolkata",
  "ahmedabad",
  "jaipur",
  "noida",
  "lucknow",
  "indore",
] as const;

export const getLocations = () => locations;
export const getPopularLocations = () =>
  locations.filter(
    (l, i, all) => all.findIndex((v) => v.city === l.city) === i,
  );
export const getLocationByPincode = (pincode: string) =>
  locations.find((l) => l.pincode === pincode);

export function getCityLocalitiesCatalog(): CityLocalityEntry[] {
  return (catalog.cities || []) as CityLocalityEntry[];
}

export function getCityBySlug(slug: string): CityLocalityEntry | undefined {
  const key = slug.trim().toLowerCase();
  if (!key) return undefined;
  return getCityLocalitiesCatalog().find((city) => city.slug === key);
}

export function slugifyPlace(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isPhase1City(slug: string) {
  return (PHASE1_CITY_SLUGS as readonly string[]).includes(slug);
}

export function getPhase1Cities(): CityLocalityEntry[] {
  return PHASE1_CITY_SLUGS.map((slug) => getCityBySlug(slug)).filter(
    (city): city is CityLocalityEntry => Boolean(city),
  );
}

export function getLocalityInCity(
  citySlug: string,
  localitySlug: string,
): { city: CityLocalityEntry; locality: string } | undefined {
  const city = getCityBySlug(citySlug);
  if (!city) return undefined;
  const key = localitySlug.trim().toLowerCase();
  const locality = city.localities.find((name) => slugifyPlace(name) === key);
  if (!locality) return undefined;
  return { city, locality };
}

export function cityHubPath(slug: string) {
  return `/locations/${slug}/`;
}

export function localityHubPath(citySlug: string, localityName: string) {
  return `/locations/${citySlug}/${slugifyPlace(localityName)}/`;
}

const CITY_BLURBS: Record<string, string> = {
  bengaluru:
    "Bengaluru has dense last-mile hiring across Koramangala, HSR, Whitefield and beyond—delivery, warehouse and field gigs close to home.",
  delhi:
    "Delhi NCR openings span South Delhi, Noida-adjacent belts and dense residential clusters—apply to roles that keep your commute short.",
  mumbai:
    "Mumbai gigs cluster around Andheri, Bandra, Thane-adjacent hubs and more—find delivery and warehouse shifts near your locality.",
  hyderabad:
    "Hyderabad hiring is strong around Madhapur, Gachibowli and older city neighbourhoods—browse open roles by area.",
  chennai:
    "Chennai jobs run from T Nagar and OMR corridors to neighbourhood hubs—pick a locality and see what is hiring now.",
  pune:
    "Pune openings stretch from Hinjewadi and Baner to older city wards—local gigs with clear pay ranges.",
  kolkata:
    "Kolkata roles cover Salt Lake, Park Street belts and residential neighbourhoods—find work closer to home.",
  ahmedabad:
    "Ahmedabad hiring spans SG Highway corridors and inner-city localities—delivery and warehouse roles updated often.",
  jaipur:
    "Jaipur gigs cover Malviya Nagar, Vaishali and central wards—browse neighbourhood listings before you apply.",
  noida:
    "Noida hiring spans Sector 62, tech-park belts and residential sectors—delivery, warehouse and field gigs close to home.",
  lucknow:
    "Lucknow hiring covers Gomti Nagar, Hazratganj-adjacent areas and residential pockets, with local roles and clear pay.",
  indore:
    "Indore openings span Vijay Nagar, Rajwada-side neighbourhoods and more—find gigs near where you live.",
};

export function citySeoBlurb(city: CityLocalityEntry) {
  return (
    CITY_BLURBS[city.slug] ||
    `Browse gig jobs across ${city.name}—delivery, warehouse and field roles listed by locality with pay you can see upfront.`
  );
}

export function localitySeoBlurb(city: CityLocalityEntry, locality: string) {
  return `Gig jobs near ${locality}, ${city.name}. See open delivery, warehouse and field roles hiring in and around ${locality}, with clear pay and apply links.`;
}
