import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { optionalBlogCover, optionalCompanyLogo } from "../middleware/upload.js";
import {
  analyticsSummary,
  listAdminJobs,
  createAdminJob,
  patchAdminJob,
  listAdminApplications,
  patchAdminApplication,
  listAdminUsers,
  listStaff,
  createStaffUser,
  patchStaffCompanies,
  listCategories,
  createCategory,
  listLocations,
  listCompanies,
  createCompany,
} from "../controllers/adminController.js";
import { analyticsTraffic } from "../controllers/analyticsController.js";
import {
  createAdminBlog,
  deleteAdminBlog,
  listAdminBlogs,
  patchAdminBlog,
} from "../controllers/blogsController.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

const applicationStaff = requireRole("admin", "hiring_manager", "recruiter");
const hiringManagers = requireRole("admin", "hiring_manager");

adminRouter.get("/applications", applicationStaff, listAdminApplications);
adminRouter.patch("/applications/:id", applicationStaff, patchAdminApplication);
adminRouter.get("/staff", hiringManagers, listStaff);

adminRouter.use(requireRole("admin"));

adminRouter.get("/analytics/summary", analyticsSummary);
adminRouter.get("/analytics/traffic", analyticsTraffic);
adminRouter.get("/jobs", listAdminJobs);
adminRouter.post("/jobs", createAdminJob);
adminRouter.patch("/jobs/:id", patchAdminJob);
adminRouter.get("/users", listAdminUsers);
adminRouter.post("/users", createStaffUser);
adminRouter.patch("/users/:id", patchStaffCompanies);
adminRouter.get("/companies", listCompanies);
adminRouter.post("/companies", optionalCompanyLogo, createCompany);
adminRouter.get("/taxonomy/categories", listCategories);
adminRouter.post("/taxonomy/categories", createCategory);
adminRouter.get("/taxonomy/locations", listLocations);
adminRouter.get("/blogs", listAdminBlogs);
adminRouter.post("/blogs", optionalBlogCover, createAdminBlog);
adminRouter.patch("/blogs/:id", optionalBlogCover, patchAdminBlog);
adminRouter.delete("/blogs/:id", deleteAdminBlog);
