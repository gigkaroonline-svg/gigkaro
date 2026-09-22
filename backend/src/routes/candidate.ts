import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listApplications,
  createApplication,
  getApplication,
  listSaved,
  saveJob,
  unsaveJob,
  getProfile,
  updateProfile,
} from "../controllers/candidateController.js";

export const applicationsRouter = Router();
// Guest apply — no sign-in required
applicationsRouter.post("/public", createApplication);
applicationsRouter.use(requireAuth);
applicationsRouter.get("/", listApplications);
applicationsRouter.post("/", createApplication);
applicationsRouter.get("/:id", getApplication);

export const savedRouter = Router();
savedRouter.use(requireAuth);
savedRouter.get("/", listSaved);
savedRouter.post("/:jobId", saveJob);
savedRouter.delete("/:jobId", unsaveJob);

export const candidatesRouter = Router();
candidatesRouter.use(requireAuth);
candidatesRouter.get("/me/profile", getProfile);
candidatesRouter.patch("/me/profile", updateProfile);
