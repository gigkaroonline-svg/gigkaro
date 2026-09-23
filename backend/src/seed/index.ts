import "dotenv/config";
import { connectDb } from "../config/db.js";
import { Company } from "../models/Company.js";
import { Job } from "../models/Job.js";
import { catalogCompanies, catalogJobs } from "./catalog.js";

async function seed() {
  await connectDb();
  for (const company of catalogCompanies) {
    await Company.findOneAndUpdate({ key: company.key }, company, {
      upsert: true,
    });
  }
  for (const job of catalogJobs) {
    await Job.findOneAndUpdate({ slug: job.slug }, job, { upsert: true });
  }
  console.log(
    `Upserted ${catalogJobs.length} jobs and ${catalogCompanies.length} companies`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
