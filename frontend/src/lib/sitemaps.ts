import { publicApiBase } from "@/lib/api";
import {
  activeJobPincodes,
  allPhase1LocalityHubs,
  countPinnedJobsForLocality,
} from "@/lib/hub-index";
import { jobCanonicalPath } from "@/lib/job-url";
import { canonicalUrl, siteOrigin } from "@/lib/metadata";
import {
  getCityBySlug,
  getCityLocalitiesCatalog,
  getPhase1Cities,
  isPhase1City,
  localityHubPath,
} from "@/lib/services/locations";

const staticPaths = [
  "/",
  "/jobs",
  "/locations",
  "/categories",
  "/about",
  "/blog",
  "/contact",
  "/hire",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

const categoryPaths = [
  "/delivery-jobs",
  "/warehouse-jobs",
  "/logistics-jobs",
  "/field-jobs",
  "/ev-rider-jobs",
] as const;

export type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

type SitemapJob = {
  slug?: string;
  postedAt?: string;
  status?: string;
  showEverywhere?: boolean;
  city?: string;
  locality?: string;
  pincode?: string;
  openings?: number;
};

function apiBase() {
  return publicApiBase();
}

/** Google fetches the address in the index. The apex host only redirects, so publish the www file URL. */
function sitemapFileOrigin() {
  if (siteOrigin === "https://gigkaro.in") return "https://www.gigkaro.in";
  return siteOrigin;
}

function entry(
  path: string,
  priority: number,
  lastModified?: string | null,
): SitemapEntry {
  return {
    url: canonicalUrl(path),
    changeFrequency: priority >= 0.8 ? "daily" : "weekly",
    priority,
    ...(lastModified ? { lastModified } : {}),
  };
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function toUrlSetXml(entries: SitemapEntry[]) {
  const body = entries
    .map((item) => {
      const parts = [`    <loc>${escapeXml(item.url)}</loc>`];
      if (item.lastModified) {
        parts.push(`    <lastmod>${escapeXml(item.lastModified)}</lastmod>`);
      }
      if (item.changeFrequency) {
        parts.push(
          `    <changefreq>${escapeXml(item.changeFrequency)}</changefreq>`,
        );
      }
      if (typeof item.priority === "number") {
        parts.push(`    <priority>${item.priority.toFixed(1)}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function toSitemapIndexXml(
  files: { path: string; lastModified?: string }[],
) {
  const body = files
    .map((file) => {
      const loc = `${sitemapFileOrigin()}${file.path.startsWith("/") ? file.path : `/${file.path}`}`;
      const parts = [`    <loc>${escapeXml(loc)}</loc>`];
      if (file.lastModified) {
        parts.push(`    <lastmod>${escapeXml(file.lastModified)}</lastmod>`);
      }
      return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

export function buildStaticSitemap(): SitemapEntry[] {
  return staticPaths.map((path) => entry(path, path === "/" ? 1 : 0.8));
}

async function fetchActiveJobs(): Promise<SitemapJob[]> {
  try {
    const res = await fetch(`${apiBase()}/jobs`, {
      // Shorter than 24h so the daily job drip can expand same day.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: SitemapJob[] };
    return (data.jobs || []).filter(
      (job) =>
        Boolean(job.slug) &&
        (!job.status || job.status.toLowerCase() === "active"),
    );
  } catch {
    return [];
  }
}

function normalizePlaceKey(value: string) {
  return value.trim().toLowerCase();
}

function istDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "00";
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/**
 * 10-day repeating IST unlock times (uneven on purpose so the drip never
 * lands at the same wall-clock time every day). Cycle restarts after day 10.
 */
export const SITEMAP_UNLOCK_MINUTES_IST = [
  9 * 60 + 17, // 09:17
  10 * 60 + 42, // 10:42
  11 * 60 + 8, // 11:08
  12 * 60 + 55, // 12:55
  14 * 60 + 23, // 14:23
  15 * 60 + 41, // 15:41
  16 * 60 + 12, // 16:12
  17 * 60 + 38, // 17:38
  18 * 60 + 5, // 18:05
  19 * 60 + 49, // 19:49
] as const;

function minutesToLabel(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} IST`;
}

export function sitemapUnlockLabelForDay(daysSinceStart0: number) {
  const cycle =
    ((Math.max(0, daysSinceStart0) % SITEMAP_UNLOCK_MINUTES_IST.length) +
      SITEMAP_UNLOCK_MINUTES_IST.length) %
    SITEMAP_UNLOCK_MINUTES_IST.length;
  return minutesToLabel(SITEMAP_UNLOCK_MINUTES_IST[cycle]);
}

function dripStartIso(startEnvKey: string, today: string) {
  const startRaw = (
    process.env[startEnvKey] ||
    process.env.SITEMAP_DRIP_START ||
    ""
  ).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(startRaw) ? startRaw : today;
}

function calendarDaysSinceStart(start: string, today: string) {
  const startUtc = Date.UTC(
    Number(start.slice(0, 4)),
    Number(start.slice(5, 7)) - 1,
    Number(start.slice(8, 10)),
  );
  const todayUtc = Date.UTC(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)) - 1,
    Number(today.slice(8, 10)),
  );
  return Math.floor((todayUtc - startUtc) / 86_400_000);
}

/**
 * Unlocked drip days (0 before the first day's unlock time).
 * Today's batch only counts after that day's rotating IST unlock.
 */
export function sitemapDripDayIndex(
  now = new Date(),
  startEnvKey = "SITEMAP_DRIP_START",
) {
  const { day: today, hour, minute } = istDateParts(now);
  const start = dripStartIso(startEnvKey, today);
  const daysSinceStart0 = calendarDaysSinceStart(start, today);
  if (daysSinceStart0 < 0) return 0;

  const cycle =
    ((daysSinceStart0 % SITEMAP_UNLOCK_MINUTES_IST.length) +
      SITEMAP_UNLOCK_MINUTES_IST.length) %
    SITEMAP_UNLOCK_MINUTES_IST.length;
  const unlockAt = SITEMAP_UNLOCK_MINUTES_IST[cycle];
  const nowMins = hour * 60 + minute;
  const unlockedToday = nowMins >= unlockAt;
  return unlockedToday ? daysSinceStart0 + 1 : daysSinceStart0;
}

/**
 * How many job URLs may appear in the jobs sitemap today.
 * Unset / 0 = all Active jobs (no drip).
 */
export function sitemapJobsDailyQuota(now = new Date()) {
  const perDay = Number(process.env.SITEMAP_JOBS_PER_DAY || 0);
  if (!Number.isFinite(perDay) || perDay <= 0) return null;
  const days = sitemapDripDayIndex(now);
  if (days <= 0) return 0;
  return Math.max(1, Math.floor(perDay)) * days;
}

type LocalityRampPhase = { days: number; rate: number };

/** Parse `7:100,7:150,200` → 7d@100, 7d@150, then forever@200. */
export function parseLocalityRamp(raw?: string): LocalityRampPhase[] {
  const source = (raw || process.env.SITEMAP_LOCALITIES_RAMP || "7:100,7:150,200").trim();
  const phases: LocalityRampPhase[] = [];
  for (const chunk of source.split(",").map((part) => part.trim()).filter(Boolean)) {
    if (chunk.includes(":")) {
      const [daysRaw, rateRaw] = chunk.split(":");
      const days = Math.max(1, Math.floor(Number(daysRaw) || 0));
      const rate = Math.max(1, Math.floor(Number(rateRaw) || 0));
      phases.push({ days, rate });
    } else {
      const rate = Math.max(1, Math.floor(Number(chunk) || 0));
      phases.push({ days: Number.POSITIVE_INFINITY, rate });
    }
  }
  if (!phases.length) return [{ days: Number.POSITIVE_INFINITY, rate: 100 }];
  if (Number.isFinite(phases[phases.length - 1].days)) {
    phases.push({ days: Number.POSITIVE_INFINITY, rate: phases[phases.length - 1].rate });
  }
  return phases;
}

/** Cumulative locality URLs after N unlocked drip days (ramped rates). */
export function cumulativeLocalityQuota(unlockedDays: number, rawRamp?: string) {
  if (unlockedDays <= 0) return 0;
  const phases = parseLocalityRamp(rawRamp);
  let day = 0;
  let total = 0;
  for (const phase of phases) {
    if (day >= unlockedDays) break;
    const take = Math.min(phase.days, unlockedDays - day);
    if (take <= 0) continue;
    total += take * phase.rate;
    day += take;
  }
  return total;
}

/**
 * How many phase-1 locality hubs may appear in the locations sitemap today.
 * Prefers SITEMAP_LOCALITIES_RAMP (100→150→200). Flat PER_DAY is fallback.
 * Unset both = all phase-1 localities at once.
 */
export function sitemapLocalitiesDailyQuota(now = new Date()) {
  const days = sitemapDripDayIndex(now, "SITEMAP_LOCATION_DRIP_START");
  const rampRaw = (process.env.SITEMAP_LOCALITIES_RAMP || "").trim();
  if (rampRaw) return cumulativeLocalityQuota(days, rampRaw);

  const perDay = Number(process.env.SITEMAP_LOCALITIES_PER_DAY || 0);
  if (!Number.isFinite(perDay) || perDay <= 0) return null;
  if (days <= 0) return 0;
  return Math.max(1, Math.floor(perDay)) * days;
}

type LocalityHub = { citySlug: string; locality: string };

/**
 * Step localities into the sitemap: pinned neighbourhoods first, then the
 * rest of the major-12 catalog in stable city → locality order.
 */
export function selectLocalitiesForSitemap(
  jobs: SitemapJob[],
  now = new Date(),
): LocalityHub[] {
  const all = allPhase1LocalityHubs();
  const ranked = [...all].sort((a, b) => {
    const cityA = getCityBySlug(a.citySlug);
    const cityB = getCityBySlug(b.citySlug);
    const pinnedA = cityA
      ? countPinnedJobsForLocality(jobs, cityA, a.locality)
      : 0;
    const pinnedB = cityB
      ? countPinnedJobsForLocality(jobs, cityB, b.locality)
      : 0;
    if (pinnedA !== pinnedB) return pinnedB - pinnedA;
    if (a.citySlug !== b.citySlug) return a.citySlug.localeCompare(b.citySlug);
    return a.locality.localeCompare(b.locality);
  });

  const quota = sitemapLocalitiesDailyQuota(now);
  if (quota == null) return ranked;
  return ranked.slice(0, quota);
}

function isPhase1JobCity(city: string) {
  const key = normalizePlaceKey(city);
  if (!key) return false;
  return getPhase1Cities().some((entry) => {
    const name = normalizePlaceKey(entry.name);
    return (
      key === name ||
      key.includes(name) ||
      name.includes(key) ||
      (entry.slug === "delhi" && key.includes("delhi"))
    );
  });
}

function scoreJobForSitemap(job: SitemapJob) {
  let score = 0;
  if (job.showEverywhere) score += 100;
  if (isPhase1JobCity(job.city || "")) score += 80;
  score += Math.min(40, Number(job.openings || 0) / 10);
  // Stable tie-break: older postedAt first so the drip prefix does not reshuffle.
  const posted = Date.parse(String(job.postedAt || "")) || 0;
  score += posted ? Math.min(20, posted / 1e12) : 0;
  return score;
}

/** Priority-ordered unique jobs, capped by the daily drip quota. */
export function selectJobsForSitemap(
  jobs: SitemapJob[],
  now = new Date(),
): SitemapJob[] {
  const ranked = [...jobs]
    .filter((job) => Boolean(job.slug))
    .sort((a, b) => {
      const scoreDiff = scoreJobForSitemap(b) - scoreJobForSitemap(a);
      if (scoreDiff) return scoreDiff;
      return String(a.slug).localeCompare(String(b.slug));
    });

  const seen = new Set<string>();
  const unique: SitemapJob[] = [];
  for (const job of ranked) {
    const path = jobCanonicalPath({
      slug: job.slug || "",
      showEverywhere: Boolean(job.showEverywhere),
    });
    if (seen.has(path)) continue;
    seen.add(path);
    unique.push(job);
  }

  const quota = sitemapJobsDailyQuota(now);
  if (quota == null) return unique;
  return unique.slice(0, quota);
}

export async function buildLocationsSitemap(): Promise<SitemapEntry[]> {
  const jobs = await fetchActiveJobs();

  // Day 1+: always the major 12 city hubs (plus any non-phase-1 city with pinned jobs).
  const pinnedCityKeys = new Set(
    jobs
      .filter((job) => !job.showEverywhere && job.city)
      .map((job) => normalizePlaceKey(job.city || ""))
      .filter(Boolean),
  );
  const catalogCities = getCityLocalitiesCatalog().filter((city) => {
    if (isPhase1City(city.slug)) return true;
    const key = normalizePlaceKey(city.name);
    return (
      pinnedCityKeys.has(key) ||
      [...pinnedCityKeys].some(
        (name) => name.includes(key) || key.includes(name),
      )
    );
  });

  const cityHubs = catalogCities.map((city) =>
    entry(`/locations/${city.slug}`, isPhase1City(city.slug) ? 0.8 : 0.6),
  );

  // Localities drip: major-12 catalogue, N new URLs per IST day until all ~4.1k are in.
  const phase1Localities = selectLocalitiesForSitemap(jobs).map((hub) =>
    entry(localityHubPath(hub.citySlug, hub.locality).replace(/\/$/, ""), 0.7),
  );

  // Category×city SEO pages for the major 12 (small, fixed set — include from day 1).
  const categoryCitySlugs = getPhase1Cities().map((city) => city.slug);
  const categoryCityPages = categoryPaths.flatMap((path) =>
    categoryCitySlugs.map((city) => entry(`${path}/${city}`, 0.6)),
  );
  return [...cityHubs, ...phase1Localities, ...categoryCityPages];
}

export async function buildPincodesSitemap(): Promise<SitemapEntry[]> {
  const jobs = await fetchActiveJobs();
  const pins = activeJobPincodes(jobs);
  return [
    ...pins.map((pin) => entry(`/jobs/${pin}`, 0.7)),
    ...categoryPaths.flatMap((path) =>
      pins.map((pin) => entry(`${path}/${pin}`, 0.6)),
    ),
  ];
}

export async function buildJobsSitemap(): Promise<SitemapEntry[]> {
  const jobs = selectJobsForSitemap(await fetchActiveJobs());
  return jobs.map((job) =>
    entry(
      jobCanonicalPath({
        slug: job.slug || "",
        showEverywhere: Boolean(job.showEverywhere),
      }),
      0.7,
      job.postedAt || null,
    ),
  );
}

export async function buildBlogSitemap(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${apiBase()}/blogs`, { cache: "force-cache" });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      posts?: {
        slug?: string;
        updatedAt?: string | null;
        publishedAt?: string | null;
      }[];
    };
    return (data.posts || [])
      .filter((post) => Boolean(post.slug))
      .map((post) =>
        entry(
          `/blog/${post.slug}`,
          0.6,
          post.updatedAt || post.publishedAt || null,
        ),
      );
  } catch {
    return [];
  }
}

export const sitemapIndexFiles = [
  "/sitemap-static.xml",
  "/sitemap-jobs.xml",
  "/sitemap-locations.xml",
  "/sitemap-pincodes.xml",
  "/sitemap-blog.xml",
] as const;
