import { Router } from "express";
import { Company } from "../models/Company.js";

export const companiesRouter = Router();

companiesRouter.get("/", async (_req, res, next) => {
  try {
    const companies = await Company.find({ active: { $ne: false } })
      .sort({ name: 1 })
      .select("key name initials color logo")
      .lean();
    res.json({
      companies: companies.map((company) => ({
        key: company.key,
        name: company.name,
        initials: company.initials,
        color: company.color,
        logo: company.logo || "",
      })),
    });
  } catch (err) {
    next(err);
  }
});
