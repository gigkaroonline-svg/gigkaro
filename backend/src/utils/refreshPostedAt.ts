import { Job } from "../models/Job.js";
import { resolvePostedAt } from "./postedAt.js";

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
let lastRefreshWeek = -1;
let refreshInFlight: Promise<void> | null = null;

/** Once per calendar week, bump stale Active job postedAt values in Mongo. */
export function maybeRefreshPostedDates() {
  const week = Math.floor(Date.now() / MS_WEEK);
  if (week === lastRefreshWeek) return;
  if (refreshInFlight) return;

  refreshInFlight = (async () => {
    try {
      const now = new Date();
      const jobs = await Job.find({ status: "Active" })
        .select("_id postedAt")
        .lean();
      const ops = [];
      for (const job of jobs) {
        const id = job._id.toString();
        const resolved = resolvePostedAt(id, job.postedAt, now);
        if (job.postedAt !== resolved.iso) {
          ops.push({
            updateOne: {
              filter: { _id: job._id },
              update: { $set: { postedAt: resolved.iso } },
            },
          });
        }
      }
      if (ops.length) await Job.bulkWrite(ops, { ordered: false });
      lastRefreshWeek = week;
    } catch {
      // Non-fatal: serialize still returns fresh dates.
    } finally {
      refreshInFlight = null;
    }
  })();
}
