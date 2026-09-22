import "dotenv/config";
import { connectDb } from "../config/db.js";
import { Job } from "../models/Job.js";
import { catalogJobs } from "./catalog.js";

async function seed() {
  await connectDb();
  let upserted = 0;
  for (const job of catalogJobs) {
    await Job.findOneAndUpdate(
      { jobKey: job.jobKey },
      { ...job, status: "Active" },
      { upsert: true, new: true },
    );
    upserted += 1;
  }
  console.log(`Seeded ${upserted} jobs`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
