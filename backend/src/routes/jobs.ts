import { Router } from "express";
import {
  listJobs,
  getJobBySlug,
  getJobsByPincode,
} from "../controllers/jobsController.js";

export const jobsRouter = Router();

jobsRouter.get("/", listJobs);
jobsRouter.get("/pincode/:pincode", getJobsByPincode);
jobsRouter.get("/:slug", getJobBySlug);
