/**
 * Renames legacy collision slugs like delivery-boy-560034-1 →
 * delivery-boy-swiggy-560034 (counter before pincode when needed).
 *
 * Run: npx tsx scripts/fix-legacy-job-slugs.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Job } from "../src/models/Job.js";
import {
  allocateJobSlug,
  isLegacyPincodeCounterSlug,
  slugWithoutPincode,
} from "../src/utils/jobs.js";
import { notifyGoogleJobUrl } from "../src/utils/googleIndexing.js";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");
const dbKind = /localhost|127\.0\.0\.1/.test(uri) ? "local" : "remote";
const dryRun = process.argv.includes("--dry-run");

await mongoose.connect(uri);

const jobs = await Job.find({ slug: { $regex: /-\d{6}-\d+$/ } });
console.log(
  `Database is ${dbKind}. Found ${jobs.length} legacy pincode-counter slug(s).${
    dryRun ? " Dry run — no writes." : ""
  }`,
);

let updated = 0;
for (const job of jobs) {
  if (!isLegacyPincodeCounterSlug(job.slug)) continue;
  const oldSlug = job.slug;
  const oldCanonical = slugWithoutPincode(oldSlug);
  const nextSlug = await allocateJobSlug({
    title: job.title,
    companyKey: job.companyId || "company",
    pincode: job.pincode,
    exists: async (candidate) => {
      if (candidate === oldSlug) return false;
      return Boolean(
        await Job.exists({
          slug: candidate,
          _id: { $ne: job._id },
        }),
      );
    },
  });
  if (nextSlug === oldSlug) {
    console.log(`skip (unchanged): ${oldSlug}`);
    continue;
  }
  console.log(`${oldSlug} → ${nextSlug}`);
  if (dryRun) continue;

  const previous = new Set([
    ...(job.previousSlugs || []),
    oldSlug,
    oldCanonical,
  ].filter(Boolean));
  job.slug = nextSlug;
  job.previousSlugs = [...previous];
  await job.save();
  updated += 1;

  if (job.status === "Active") {
    void notifyGoogleJobUrl(oldSlug, "URL_DELETED", {
      showEverywhere: Boolean(job.showEverywhere),
    });
    void notifyGoogleJobUrl(nextSlug, "URL_UPDATED", {
      showEverywhere: Boolean(job.showEverywhere),
    });
  }
}

console.log(`Updated ${updated} of ${jobs.length} job slug(s).`);
await mongoose.disconnect();
