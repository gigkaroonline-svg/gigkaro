import "dotenv/config";
import { connectDb } from "../config/db.js";
import { Job } from "../models/Job.js";
import { Company } from "../models/Company.js";

const dummyCompanyKeys = ["swift", "fresh", "pack", "volt", "meal", "local"];

async function seed() {
  await connectDb();
  const jobs = await Job.deleteMany({ jobKey: /^job_\d+_\d+$/ });
  const companies = await Company.deleteMany({ key: { $in: dummyCompanyKeys } });
  console.log(
    `Removed dummy data (${jobs.deletedCount} jobs, ${companies.deletedCount} companies)`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
