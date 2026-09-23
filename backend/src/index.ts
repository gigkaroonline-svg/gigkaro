import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { bootstrapAdmin } from "./config/bootstrap.js";
import { authRouter } from "./routes/auth.js";
import { jobsRouter } from "./routes/jobs.js";
import { locationsRouter } from "./routes/locations.js";
import { adminRouter } from "./routes/admin.js";
import {
  applicationsRouter,
  savedRouter,
  candidatesRouter,
} from "./routes/candidate.js";

async function main() {
  await connectDb();

  const { Job } = await import("./models/Job.js");
  const { Company } = await import("./models/Company.js");
  const { Category } = await import("./models/Category.js");
  const { catalogCategories } = await import("./data/taxonomy.js");
  const dummyCompanyKeys = ["swift", "fresh", "pack", "volt", "meal", "local"];
  const removedJobs = await Job.deleteMany({ jobKey: /^job_\d+_\d+$/ });
  const removedCompanies = await Company.deleteMany({
    key: { $in: dummyCompanyKeys },
  });
  if (removedJobs.deletedCount || removedCompanies.deletedCount) {
    console.log(
      `Removed dummy data (${removedJobs.deletedCount} jobs, ${removedCompanies.deletedCount} companies)`,
    );
  }
  if ((await Category.countDocuments()) === 0) {
    await Category.insertMany(catalogCategories);
    console.log(`Auto-seeded ${catalogCategories.length} categories`);
  }
  const { seedPincodesIfEmpty } = await import("./utils/seedPincodes.js");
  await seedPincodesIfEmpty();

  await bootstrapAdmin();

  const app = express();
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(morgan("dev"));
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "gigkaro-api" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/locations", locationsRouter);
  app.use("/api/applications", applicationsRouter);
  app.use("/api/saved", savedRouter);
  app.use("/api/candidates", candidatesRouter);
  app.use("/api/admin", adminRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    },
  );

  app.listen(env.port, "127.0.0.1", () => {
    console.log(`GigKaro API ready at http://127.0.0.1:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API", err);
  process.exit(1);
});
