/** Keep in step with frontend PHASE1_CITY_SLUGS / popular hubs. */
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

/** Normalized city name needles for job.city matching. */
export const PHASE1_CITY_NEEDLES = [
  "bengaluru",
  "bangalore",
  "delhi",
  "delhi ncr",
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

export function isPhase1CityName(city: string) {
  const key = city.trim().toLowerCase().replace(/\s+ncr$/i, "").trim();
  if (!key) return false;
  return PHASE1_CITY_NEEDLES.some(
    (needle) => key === needle || key.includes(needle) || needle.includes(key),
  );
}
