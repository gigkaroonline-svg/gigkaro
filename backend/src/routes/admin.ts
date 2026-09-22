import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { optionalCompanyLogo } from "../middleware/upload.js";
import {
  analyticsSummary,
  listAdminJobs,
  createAdminJob,
  patchAdminJob,
  listAdminApplications,
  patchAdminApplication,
  listAdminUsers,
  listCategories,
  createCategory,
  listLocations,
  listCompanies,
  createCompany,
} from "../controllers/adminController.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/analytics/summary", analyticsSummary);
adminRouter.get("/jobs", listAdminJobs);
adminRouter.post("/jobs", createAdminJob);
adminRouter.patch("/jobs/:id", patchAdminJob);
adminRouter.get("/applications", listAdminApplications);
adminRouter.patch("/applications/:id", patchAdminApplication);
adminRouter.get("/users", listAdminUsers);
adminRouter.get("/companies", listCompanies);
adminRouter.post("/companies", optionalCompanyLogo, createCompany);
adminRouter.get("/taxonomy/categories", listCategories);
adminRouter.post("/taxonomy/categories", createCategory);
adminRouter.get("/taxonomy/locations", listLocations);
