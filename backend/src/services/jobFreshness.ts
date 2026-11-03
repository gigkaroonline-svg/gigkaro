import { isPhase1CityName } from "../data/phase1Cities.js";
import { Job } from "../models/Job.js";
import { JobFreshnessRun } from "../models/JobFreshnessRun.js";
import { env } from "../config/env.js";
import { notifyGoogleJobUrl } from "../utils/googleIndexing.js";

export type FreshnessSlot = "A" | "B" | "C";

const SLOT_MINUTES: Record<FreshnessSlot, number> = {
  // IST wall-clock minutes from midnight — uneven on purpose.
  A: 9 * 60 + 40, // 09:40
  B: 14 * 60 + 25, // 14:25
  C: 21 * 60 + 5, // 21:05
};

const MS_DAY = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 20 * 60 * 60 * 1000; // no re-notify within ~20h

function istParts(now = new Date()) {
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

function dayOfYearIst(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const start = Date.UTC(y, 0, 0);
  return Math.floor((utc - start) / MS_DAY);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitterMs() {
  return 1200 + Math.floor(Math.random() * 1800);
}

type LeanJob = {
  _id: { toString(): string };
  slug: string;
  city: string;
  locality?: string;
  showEverywhere?: boolean;
  postedAt?: string;
  lastIndexedAt?: Date | null;
  openings?: number;
};

function scoreJob(job: LeanJob, now: number) {
  let score = 0;
  if (job.showEverywhere) score += 100;
  if (isPhase1CityName(job.city || "")) score += 80;
  score += Math.min(40, Number(job.openings || 0) / 10);
  const last = job.lastIndexedAt ? new Date(job.lastIndexedAt).getTime() : 0;
  if (!last) score += 50;
  else score += Math.min(40, (now - last) / MS_DAY);
  return score;
}

function selectCohort(jobs: LeanJob[], slot: FreshnessSlot, day: string, limit: number) {
  const now = Date.now();
  const eligible = jobs
    .filter((job) => {
      if (!job.slug) return false;
      if (!job.showEverywhere && !isPhase1CityName(job.city || "")) return false;
      const last = job.lastIndexedAt ? new Date(job.lastIndexedAt).getTime() : 0;
      return !last || now - last >= COOLDOWN_MS;
    })
    .map((job) => ({ job, score: scoreJob(job, now) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aLast = a.job.lastIndexedAt
        ? new Date(a.job.lastIndexedAt).getTime()
        : 0;
      const bLast = b.job.lastIndexedAt
        ? new Date(b.job.lastIndexedAt).getTime()
        : 0;
      return aLast - bLast;
    })
    .map((row) => row.job);

  if (!eligible.length) return [] as LeanJob[];

  const slotIndex = slot === "A" ? 0 : slot === "B" ? 1 : 2;
  const offset =
    (dayOfYearIst(day) * 3 + slotIndex * 17) % eligible.length;
  const picked: LeanJob[] = [];
  for (let i = 0; i < Math.min(limit, eligible.length); i += 1) {
    picked.push(eligible[(offset + i) % eligible.length]);
  }
  return picked;
}

export function slotDueNow(now = new Date()): FreshnessSlot | null {
  const { hour, minute } = istParts(now);
  const current = hour * 60 + minute;
  for (const slot of ["A", "B", "C"] as FreshnessSlot[]) {
    const target = SLOT_MINUTES[slot];
    // Fire within a 2-minute window so a 60s ticker does not miss it.
    if (current >= target && current <= target + 1) return slot;
  }
  return null;
}

export async function runJobFreshnessSlot(
  slot: FreshnessSlot,
  options?: { dryRun?: boolean; limit?: number; force?: boolean },
) {
  const dryRun = Boolean(options?.dryRun);
  const limit = Math.max(
    1,
    Math.min(
      100,
      options?.limit || env.googleIndexingBatchSize || 50,
    ),
  );
  const { day } = istParts();

  if (!options?.force) {
    const existing = await JobFreshnessRun.findOne({ day, slot }).lean();
    if (existing?.completedAt) {
      return {
        day,
        slot,
        skipped: true,
        reason: "Slot already completed today",
        notified: existing.notified,
        failed: existing.failed,
      };
    }
  }

  const run = await JobFreshnessRun.findOneAndUpdate(
    { day, slot },
    {
      $set: {
        startedAt: new Date(),
        completedAt: null,
        dryRun,
        notified: 0,
        failed: 0,
        skipped: 0,
        note: options?.force ? "Forced re-run" : "",
      },
      $setOnInsert: { day, slot },
    },
    { upsert: true, new: true },
  );

  const jobs = (await Job.find({ status: "Active" })
    .select(
      "slug city locality showEverywhere postedAt lastIndexedAt openings",
    )
    .lean()) as LeanJob[];

  const cohort = selectCohort(jobs, slot, day, limit);
  const today = new Date().toISOString().slice(0, 10);
  let notified = 0;
  let failed = 0;
  let skipped = 0;
  let stoppedEarly = false;

  for (const job of cohort) {
    if (dryRun || !env.googleIndexingEnabled) {
      skipped += 1;
      if (!dryRun) {
        await Job.updateOne(
          { _id: job._id },
          {
            $set: {
              lastIndexedAt: new Date(),
              lastIndexStatus: "skipped",
              lastIndexError: env.googleIndexingEnabled
                ? ""
                : "GOOGLE_INDEXING_ENABLED is off",
            },
          },
        );
      }
      continue;
    }

    const result = await notifyGoogleJobUrl(job.slug, "URL_UPDATED", {
      showEverywhere: Boolean(job.showEverywhere),
    });

    if (result.ok && !result.skipped) {
      notified += 1;
      // Bump datePosted only after Google accepted the URL_UPDATED notify.
      await Job.updateOne(
        { _id: job._id },
        {
          $set: {
            postedAt: today,
            lastIndexedAt: new Date(),
            lastIndexStatus: "ok",
            lastIndexError: "",
          },
        },
      );
    } else if (result.ok && result.skipped) {
      skipped += 1;
      await Job.updateOne(
        { _id: job._id },
        {
          $set: {
            lastIndexedAt: new Date(),
            lastIndexStatus: "skipped",
            lastIndexError: "",
          },
        },
      );
    } else {
      failed += 1;
      await Job.updateOne(
        { _id: job._id },
        {
          $set: {
            lastIndexedAt: new Date(),
            lastIndexStatus: "failed",
            lastIndexError: result.error || "Indexing failed",
          },
        },
      );
      if (result.status === 429) {
        stoppedEarly = true;
        break;
      }
    }

    await sleep(jitterMs());
  }

  run.notified = notified;
  run.failed = failed;
  run.skipped = skipped;
  run.dryRun = dryRun;
  run.completedAt = new Date();
  run.note = stoppedEarly
    ? "Stopped early after HTTP 429"
    : `Processed ${cohort.length} jobs`;
  await run.save();

  return {
    day,
    slot,
    skipped: false,
    cohort: cohort.length,
    notified,
    failed,
    indexingSkipped: skipped,
    stoppedEarly,
    dryRun,
  };
}

export function startJobFreshnessScheduler() {
  if (!env.googleFreshnessEnabled) {
    console.log(
      "Job freshness scheduler is off (set GOOGLE_FRESHNESS_ENABLED=true to enable).",
    );
    return;
  }

  let running = false;
  const tick = async () => {
    if (running) return;
    const slot = slotDueNow();
    if (!slot) return;
    running = true;
    try {
      const result = await runJobFreshnessSlot(slot);
      if (!("reason" in result && result.skipped)) {
        console.log(
          `Job freshness slot ${slot}: notified=${result.notified} failed=${result.failed} cohort=${result.cohort}`,
        );
      }
    } catch (err) {
      console.error(
        "Job freshness slot failed",
        err instanceof Error ? err.message : err,
      );
    } finally {
      running = false;
    }
  };

  void tick();
  setInterval(() => void tick(), 60_000);
  console.log(
    "Job freshness scheduler armed for IST slots 09:40 / 14:25 / 21:05.",
  );
}
