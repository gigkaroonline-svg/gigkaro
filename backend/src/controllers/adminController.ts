import type { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { User } from "../models/User.js";
import { isStaffRole, recruiterStatuses } from "../auth/roles.js";
import { hashPassword } from "../utils/password.js";
import { Company } from "../models/Company.js";
import { Category } from "../models/Category.js";
import { serializeJob } from "../utils/jobs.js";
import { uploadCompanyLogo } from "../utils/gcs.js";
import { locationCatalog } from "../data/taxonomy.js";
import { getIndiaPincode } from "../utils/indiaPincodes.js";
import type { AuthRequest } from "../middleware/auth.js";

function locationLabelForPincode(pincode: string) {
  const pin = String(pincode || "").trim();
  if (!pin) return "";
  const catalog = locationCatalog.find((l) => l.pincode === pin);
  if (catalog) return `${catalog.locality}, ${catalog.city}`;
  const india = getIndiaPincode(pin);
  if (india) {
    const locality = india.locality || india.city;
    if (locality && india.city && locality !== india.city) {
      return `${locality}, ${india.city}`;
    }
    return locality || india.city || "";
  }
  return "";
}

const jobStatuses = [
  "Active",
  "Paused",
  "Rejected",
  "Pending approval",
  "Expired",
] as const;

const appStatuses = [
  "Applied",
  "Contacted",
  "Interview",
  "Selected",
  "Joined",
] as const;

const companyColors = [
  "blue",
  "green",
  "orange",
  "violet",
  "rose",
  "teal",
  "slate",
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "gk";
  if (parts.length === 1) return parts[0].slice(0, 2).toLowerCase();
  return (parts[0][0] + parts[1][0]).toLowerCase();
}

function serializeCompany(
  company: {
    _id: { toString(): string };
    key: string;
    name: string;
    initials: string;
    color: string;
    logo?: string;
    active?: boolean;
  },
  extras?: { jobs?: number; activeJobs?: number },
) {
  return {
    id: company._id.toString(),
    key: company.key,
    name: company.name,
    initials: company.initials,
    color: company.color,
    logo: company.logo || "",
    active: company.active !== false,
    jobs: extras?.jobs ?? 0,
    activeJobs: extras?.activeJobs ?? 0,
  };
}

export async function analyticsSummary(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const [
      jobsByStatus,
      appsByStatus,
      usersByRole,
      pendingJobs,
      activeJobs,
      totalApplications,
    ] = await Promise.all([
      Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Job.countDocuments({ status: "Pending approval" }),
      Job.countDocuments({ status: "Active" }),
      Application.countDocuments(),
    ]);

    const toMap = (rows: { _id: string; count: number }[]) =>
      Object.fromEntries(rows.map((r) => [r._id || "unknown", r.count]));

    const funnel = Object.fromEntries(
      await Promise.all(
        appStatuses.map(async (status) => [
          status,
          await Application.countDocuments({ status }),
        ]),
      ),
    );

    const cityCounts = await Job.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    res.json({
      jobsByStatus: toMap(jobsByStatus),
      applicationsByStatus: toMap(appsByStatus),
      usersByRole: toMap(usersByRole),
      pendingJobs,
      activeJobs,
      totalApplications,
      activePincodes: locationCatalog.length,
      funnel,
      cities: cityCounts.map((c) => ({
        city: c._id,
        count: c.count,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminJobs(
  req: { query: Record<string, unknown> },
  res: Response,
  next: NextFunction,
) {
  try {
    const status = String(req.query.status || "");
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const filter: Record<string, unknown> = {};
    if (status && jobStatuses.includes(status as (typeof jobStatuses)[number])) {
      filter.status = status;
    }
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { company: new RegExp(q, "i") },
        { pincode: new RegExp(q, "i") },
        { locality: new RegExp(q, "i") },
      ];
    }
    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    res.json({
      total,
      page,
      jobs: jobs.map((j) => serializeJob(j)),
    });
  } catch (err) {
    next(err);
  }
}

export async function createAdminJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        title: z.string().trim().min(3).max(120),
        companyId: z.string().trim().min(1),
        category: z.string().trim().min(1).max(40),
        pincode: z.string().trim().min(4).max(10),
        salaryMin: z.number().int().min(0),
        salaryMax: z.number().int().min(0),
        openings: z.number().int().min(1).max(500).default(1),
        incentiveMax: z.number().int().min(0).default(0),
        immediateJoining: z.boolean().default(false),
        vehicle: z.enum([
          "Bike required",
          "EV accepted",
          "No vehicle required",
        ]),
        employmentType: z.enum(["Full-time", "Part-time", "Flexible"]),
        shift: z.enum(["Morning", "Evening", "Night", "Flexible"]),
        description: z.string().trim().min(10).max(4000),
        requirements: z.array(z.string().trim().min(1)).max(20).default([]),
        status: z.enum(jobStatuses).default("Active"),
        showEverywhere: z.boolean().default(true),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid job payload.",
      });
      return;
    }

    const data = parsed.data;
    if (data.salaryMax < data.salaryMin) {
      res.status(400).json({ error: "salaryMax must be >= salaryMin." });
      return;
    }

    const company =
      (await Company.findById(data.companyId)) ||
      (await Company.findOne({ key: data.companyId }));
    if (!company || company.active === false) {
      res.status(400).json({ error: "Select a valid company." });
      return;
    }

    const categoryDoc =
      (await Category.findOne({ key: data.category, active: true })) ||
      (await Category.findById(data.category));
    if (!categoryDoc || categoryDoc.active === false) {
      res.status(400).json({ error: "Select a valid category." });
      return;
    }
    const categoryKey = categoryDoc.key;

    const location =
      locationCatalog.find((l) => l.pincode === data.pincode) || null;
    if (!location) {
      res.status(400).json({
        error: "Pick a pincode from the supported location catalog.",
      });
      return;
    }

    const baseSlug = slugify(`${data.title}-${location.pincode}`) || "job";
    let slug = baseSlug;
    let n = 1;
    while (await Job.exists({ slug })) {
      slug = `${baseSlug}-${n++}`;
    }
    const jobKey = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const job = await Job.create({
      jobKey,
      slug,
      title: data.title,
      company: company.name,
      companyId: company.key,
      initials: company.initials,
      color: company.color,
      category: categoryKey,
      city: location.city,
      locality: location.locality,
      pincode: location.pincode,
      lat: location.lat,
      lng: location.lng,
      distanceKm: 0,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      salaryType: "monthly",
      incentiveMax: data.incentiveMax,
      openings: data.openings,
      immediateJoining: data.immediateJoining,
      vehicle: data.vehicle,
      verified: true,
      employmentType: data.employmentType,
      shift: data.shift,
      postedAt: new Date().toISOString().slice(0, 10),
      description: data.description,
      requirements: data.requirements,
      status: data.status,
      showEverywhere: data.showEverywhere,
      postedByAdminId: req.userId,
    });

    res.status(201).json({ job: serializeJob(job) });
  } catch (err) {
    next(err);
  }
}

export async function listCompanies(
  req: { query: Record<string, unknown> },
  res: Response,
  next: NextFunction,
) {
  try {
    const q = String(req.query.q || "").trim();
    const activeOnly = String(req.query.active || "") === "1";
    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.active = true;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { key: new RegExp(q, "i") },
      ];
    }
    const companies = await Company.find(filter).sort({ name: 1 }).limit(200);
    const withCounts = await Promise.all(
      companies.map(async (c) => {
        const [jobs, activeJobs] = await Promise.all([
          Job.countDocuments({ companyId: c.key }),
          Job.countDocuments({ companyId: c.key, status: "Active" }),
        ]);
        return serializeCompany(c, { jobs, activeJobs });
      }),
    );
    res.json({ companies: withCounts });
  } catch (err) {
    next(err);
  }
}

export async function createCompany(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        name: z.string().trim().min(2).max(80),
        initials: z.string().trim().min(1).max(4).optional(),
        color: z.enum(companyColors).default("blue"),
        key: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid company payload.",
      });
      return;
    }
    const name = parsed.data.name;
    let key = parsed.data.key || slugify(name);
    if (!key) key = `co-${Date.now().toString(36)}`;
    if (await Company.exists({ key })) {
      res.status(409).json({ error: "A company with this key already exists." });
      return;
    }
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    const logo = file ? await uploadCompanyLogo(file) : "";
    const company = await Company.create({
      key,
      name,
      initials: (parsed.data.initials || initialsFrom(name)).slice(0, 4),
      color: parsed.data.color,
      logo,
      active: true,
    });
    res.status(201).json({ company: serializeCompany(company) });
  } catch (err) {
    next(err);
  }
}

export async function patchAdminJob(
  req: { params: { id: string }; body: unknown },
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        status: z.enum(jobStatuses),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: parsed.data.status },
      { new: true },
    );
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }
    res.json({ job: serializeJob(job) });
  } catch (err) {
    next(err);
  }
}

async function companyKeysFor(keys: string[]) {
  const unique = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
  if (!unique.length) return [];
  const companies = await Company.find({ key: { $in: unique } }).select("key");
  if (companies.length !== unique.length) {
    return null;
  }
  return unique;
}

async function jobIdsForCompanies(keys: string[]) {
  if (!keys.length) return [];
  const jobs = await Job.find({ companyId: { $in: keys } }).select("_id");
  return jobs.map((job) => job._id);
}

function uniqueKeys(keys: Array<string | undefined | null>) {
  return [...new Set(keys.map((key) => String(key || "").trim()).filter(Boolean))];
}

async function managerCompanyKeys(managerId: unknown) {
  if (!managerId) return [];
  const manager = await User.findById(managerId).select("role companyKeys");
  if (!manager || manager.role !== "hiring_manager") return [];
  return manager.companyKeys || [];
}

async function effectiveCompanyKeys(user: {
  role?: string;
  companyKeys?: string[];
  managerId?: unknown;
}) {
  const own = user.companyKeys || [];
  if (user.role !== "recruiter") return own;
  return uniqueKeys([...own, ...(await managerCompanyKeys(user.managerId))]);
}

function serializeManagerHistory(
  entries: Array<{
    managerId?: unknown;
    name?: string;
    email?: string;
    startedAt?: Date;
    endedAt?: Date | null;
  }> | undefined,
) {
  return [...(entries || [])]
    .map((entry) => ({
      managerId: entry.managerId ? String(entry.managerId) : null,
      name: entry.name || "",
      email: entry.email || "",
      startedAt: entry.startedAt ? new Date(entry.startedAt).toISOString() : "",
      endedAt: entry.endedAt ? new Date(entry.endedAt).toISOString() : null,
    }))
    .sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""));
}

async function recordManagerAssignment(
  user: {
    managerId?: unknown;
    managerHistory?: Array<{
      managerId?: unknown;
      name?: string;
      email?: string;
      startedAt?: Date;
      endedAt?: Date | null;
    }>;
    createdAt?: Date;
  },
  manager: { _id: mongoose.Types.ObjectId; name?: string | null; email?: string | null },
) {
  const nextId = String(manager._id);
  const currentId = user.managerId ? String(user.managerId) : "";
  if (currentId === nextId) return manager.name || manager.email || "";
  const now = new Date();
  const history: Array<{
    managerId?: unknown;
    name: string;
    email: string;
    startedAt?: Date;
    endedAt?: Date;
  }> = (user.managerHistory || []).map((entry) => ({
    managerId: entry.managerId,
    name: entry.name || "",
    email: entry.email || "",
    startedAt: entry.startedAt,
    endedAt: entry.endedAt || undefined,
  }));
  const open = history.find((entry) => !entry.endedAt);
  if (open) {
    open.endedAt = now;
  } else if (currentId) {
    const previous = await User.findById(currentId).select("name email");
    history.push({
      managerId: user.managerId,
      name: previous?.name || previous?.email || "Previous manager",
      email: previous?.email || "",
      startedAt: user.createdAt || now,
      endedAt: now,
    });
  }
  history.push({
    managerId: manager._id,
    name: manager.name || manager.email || "",
    email: manager.email || "",
    startedAt: now,
  });
  user.managerHistory = history;
  user.managerId = manager._id;
  return manager.name || manager.email || "";
}

async function hiringManagerById(id: string | undefined | null) {
  if (!id || !mongoose.isValidObjectId(id)) return null;
  const manager = await User.findById(id).select("role name email");
  if (!manager || manager.role !== "hiring_manager") return null;
  return manager;
}

async function staffCoversApplication(
  user: { _id?: { toString(): string }; role?: string; companyKeys?: string[]; managerId?: unknown } | undefined,
  jobId: unknown,
  assignedTo?: unknown,
) {
  if (!user || user.role === "admin") return true;
  const assignedId = assignedTo ? String(assignedTo) : "";
  if (user.role === "recruiter" && assignedId && assignedId === user._id?.toString()) return true;
  if (user.role === "hiring_manager" && assignedId) {
    const recruiter = await User.findById(assignedId).select("role managerId");
    if (
      recruiter?.role === "recruiter" &&
      recruiter.managerId &&
      String(recruiter.managerId) === user._id?.toString()
    ) {
      return true;
    }
  }
  const keys =
    user.role === "hiring_manager"
      ? uniqueKeys([
          ...(user.companyKeys || []),
          ...(
            await User.find({ role: "recruiter", managerId: user._id }).select("companyKeys")
          ).flatMap((recruiter) => recruiter.companyKeys || []),
        ])
      : await effectiveCompanyKeys(user);
  if (!keys.length) return false;
  const job = await Job.findById(jobId).select("companyId");
  return !!job && keys.includes(job.companyId);
}

async function applicationScope(user: {
  _id: mongoose.Types.ObjectId;
  role?: string;
  companyKeys?: string[];
  managerId?: unknown;
}) {
  if (user.role === "recruiter") {
    const jobIds = await jobIdsForCompanies(await effectiveCompanyKeys(user));
    return {
      $or: [{ assignedTo: user._id }, { assignedTo: null, jobId: { $in: jobIds } }],
    };
  }
  if (user.role === "hiring_manager") {
    const team = await User.find({ role: "recruiter", managerId: user._id }).select(
      "_id companyKeys",
    );
    const jobIds = await jobIdsForCompanies(
      uniqueKeys([
        ...(user.companyKeys || []),
        ...team.flatMap((recruiter) => recruiter.companyKeys || []),
      ]),
    );
    return {
      $or: [{ jobId: { $in: jobIds } }, { assignedTo: { $in: team.map((recruiter) => recruiter._id) } }],
    };
  }
  return null;
}

function assignedRecruiter(value: unknown) {
  if (!value || typeof value !== "object" || !("_id" in value)) return null;
  const user = value as {
    _id?: { toString(): string };
    name?: string;
    email?: string;
  };
  if (!user._id) return null;
  return {
    id: user._id.toString(),
    name: user.name || "",
    email: user.email || "",
  };
}

export async function listAdminApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const status = String(req.query.status || "");
    const q = String(req.query.q || "").trim();
    const clauses: Record<string, unknown>[] = [];
    if (req.user && (req.user.role === "recruiter" || req.user.role === "hiring_manager")) {
      const scope = await applicationScope(req.user);
      if (scope) clauses.push(scope);
    }
    if (status && appStatuses.includes(status as (typeof appStatuses)[number])) {
      clauses.push({ status });
    }
    if (q) {
      clauses.push({
        $or: [
          { name: new RegExp(q, "i") },
          { mobile: new RegExp(q, "i") },
          { pincode: new RegExp(q, "i") },
        ],
      });
    }
    const filter = clauses.length ? { $and: clauses } : {};
    const apps = await Application.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("jobId")
      .populate("userId", "name mobile email role profile")
      .populate("assignedTo", "name email role");

    res.json({
      applications: apps.map((a) => {
        const jobRaw = a.jobId as unknown;
        const job =
          jobRaw && typeof jobRaw === "object" && "slug" in jobRaw
            ? serializeJob(jobRaw as Parameters<typeof serializeJob>[0])
            : null;
        const userRaw = a.userId as unknown as {
          _id?: { toString(): string };
          name?: string;
          mobile?: string;
          email?: string;
          role?: string;
        } | null;
        return {
          id: a._id.toString(),
          jobId:
            job?.id ||
            (typeof a.jobId === "object" && a.jobId && "_id" in a.jobId
              ? String((a.jobId as { _id: unknown })._id)
              : String(a.jobId)),
          name: a.name,
          mobile: a.mobile,
          pincode: a.pincode,
          location: locationLabelForPincode(a.pincode),
          bike: a.bike,
          licence: a.licence,
          joining: a.joining,
          status: a.status,
          createdAt: a.createdAt?.toISOString?.() ?? new Date().toISOString(),
          experience: a.joining,
          assignedTo: assignedRecruiter(a.assignedTo),
          partnerCheck: a.partnerCheck?.status
            ? {
                status: a.partnerCheck.status,
                clientName: a.partnerCheck.clientName || "",
                detail: a.partnerCheck.detail || "",
              }
            : null,
          job,
          candidate: userRaw
            ? {
                id: userRaw._id?.toString() || "",
                name: userRaw.name || "",
                mobile: userRaw.mobile || "",
                email: userRaw.email || "",
                role: userRaw.role || "candidate",
              }
            : null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function patchAdminApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        status: z.enum(appStatuses).optional(),
        assignedTo: z.string().nullable().optional(),
      })
      .refine((value) => value.status !== undefined || value.assignedTo !== undefined, {
        message: "Nothing to update.",
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid update." });
      return;
    }

    const role = req.user?.role;
    const app = await Application.findById(req.params.id);
    if (!app) {
      res.status(404).json({ error: "Application not found." });
      return;
    }

    const inScope = await staffCoversApplication(req.user, app.jobId, app.assignedTo);
    if (!inScope) {
      res.status(403).json({ error: "This application is outside your companies." });
      return;
    }

    const assignedId = app.assignedTo ? String(app.assignedTo) : "";
    if (role === "recruiter" && assignedId && assignedId !== req.userId) {
      res.status(403).json({ error: "This application is assigned to another recruiter." });
      return;
    }

    const update: { status?: (typeof appStatuses)[number]; assignedTo?: mongoose.Types.ObjectId | null } = {};

    if (parsed.data.assignedTo !== undefined) {
      if (role !== "admin" && role !== "hiring_manager") {
        res.status(403).json({
          error: "Only an admin or hiring manager can assign a recruiter.",
        });
        return;
      }
      const nextAssignee = parsed.data.assignedTo?.trim() || "";
      if (!nextAssignee) {
        update.assignedTo = null;
      } else {
        if (!mongoose.isValidObjectId(nextAssignee)) {
          res.status(400).json({ error: "Choose a recruiter." });
          return;
        }
        const recruiter = await User.findById(nextAssignee).select("role companyKeys managerId");
        if (!recruiter || recruiter.role !== "recruiter") {
          res.status(400).json({ error: "Assign a recruiter account." });
          return;
        }
        if (
          role === "hiring_manager" &&
          String(recruiter.managerId || "") !== req.userId
        ) {
          res.status(403).json({ error: "You can only assign recruiters on your team." });
          return;
        }
        const job = await Job.findById(app.jobId).select("companyId");
        const covered = await effectiveCompanyKeys(recruiter);
        if (job && !covered.includes(job.companyId)) {
          res.status(400).json({
            error: "That recruiter is not on a team that covers this company.",
          });
          return;
        }
        update.assignedTo = recruiter._id;
      }
    }

    if (parsed.data.status) {
      if (role === "recruiter") {
        const allowed = recruiterStatuses.includes(
          parsed.data.status as (typeof recruiterStatuses)[number],
        );
        const locked = app.status === "Selected" || app.status === "Joined";
        if (!allowed || locked) {
          res.status(403).json({
            error: "Recruiters can set Contacted or Interview only.",
          });
          return;
        }
      }
      update.status = parsed.data.status;
      if (role === "recruiter" && !assignedId) {
        update.assignedTo = req.user?._id;
      }
    }

    Object.assign(app, update);
    await app.save();
    await app.populate("jobId");
    await app.populate("assignedTo", "name email role");

    const jobRaw = app.jobId as unknown;
    const job =
      jobRaw && typeof jobRaw === "object" && "slug" in jobRaw
        ? serializeJob(jobRaw as Parameters<typeof serializeJob>[0])
        : null;
    res.json({
      application: {
        id: app._id.toString(),
        jobId: job?.id || String(app.jobId),
        name: app.name,
        mobile: app.mobile,
        pincode: app.pincode,
        bike: app.bike,
        licence: app.licence,
        joining: app.joining,
        status: app.status,
        assignedTo: assignedRecruiter(app.assignedTo),
        createdAt: app.createdAt?.toISOString?.() ?? new Date().toISOString(),
        job,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminUsers(
  req: { query: Record<string, unknown> },
  res: Response,
  next: NextFunction,
) {
  try {
    const role = String(req.query.role || "");
    const q = String(req.query.q || "").trim();
    const filter: Record<string, unknown> = {};
    if (role === "staff") {
      filter.role = { $in: ["admin", "hiring_manager", "recruiter"] };
    } else if (
      role === "candidate" ||
      role === "employer" ||
      role === "admin" ||
      role === "hiring_manager" ||
      role === "recruiter"
    ) {
      filter.role = role;
    }
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { mobile: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    const managerIds = users.map((user) => user.managerId).filter(Boolean);
    const managers = await User.find({ _id: { $in: managerIds } }).select("name email");
    const managerNames = new Map(
      managers.map((manager) => [manager._id.toString(), manager.name || manager.email || ""]),
    );
    const withCounts = await Promise.all(
      users.map(async (u) => {
        const [applications, jobs] = await Promise.all([
          Application.countDocuments({ userId: u._id }),
          Job.countDocuments({
            $or: [{ employerId: u._id }, { companyId: u._id.toString() }],
          }),
        ]);
        return {
          id: u._id.toString(),
          role: u.role,
          name: u.name || u.profile?.name || "",
          mobile: u.mobile || u.profile?.mobile || "",
          email: u.email || u.profile?.email || "",
          city: u.profile?.city || "",
          pincode: u.profile?.pincode || "",
          applications,
          jobs,
          companyKeys: u.companyKeys || [],
          managerId: u.managerId ? String(u.managerId) : null,
          managerName: u.managerId ? managerNames.get(String(u.managerId)) || "" : "",
          managerHistory: serializeManagerHistory(u.managerHistory),
          createdAt: u.createdAt?.toISOString?.() ?? "",
        };
      }),
    );
    res.json({ users: withCounts });
  } catch (err) {
    next(err);
  }
}

export async function listStaff(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const role = String(req.query.role || "");
    const filter: Record<string, unknown> = {
      role:
        role === "recruiter" || role === "hiring_manager"
          ? role
          : { $in: ["hiring_manager", "recruiter"] },
    };
    if (req.user?.role === "hiring_manager") {
      filter.role = "recruiter";
      filter.managerId = req.user._id;
    }
    const users = await User.find(filter)
      .select("name email role companyKeys managerId")
      .sort({ name: 1 })
      .limit(200);
    const managerIds = users.map((user) => user.managerId).filter(Boolean);
    const managers = await User.find({ _id: { $in: managerIds } }).select("companyKeys");
    const managerKeys = new Map(
      managers.map((manager) => [manager._id.toString(), manager.companyKeys || []]),
    );
    res.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        role: user.role,
        name: user.name || "",
        email: user.email || "",
        managerId: user.managerId ? String(user.managerId) : null,
        companyKeys: uniqueKeys([
          ...(user.companyKeys || []),
          ...(user.managerId ? managerKeys.get(String(user.managerId)) || [] : []),
        ]),
      })),
    });
  } catch (err) {
    next(err);
  }
}

const staffUserSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(100),
  role: z.enum(["admin", "hiring_manager", "recruiter"]),
  companyKeys: z.array(z.string().trim().min(1)).max(50).optional(),
  managerId: z.string().trim().optional(),
});

export async function createStaffUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = staffUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || "Enter a name, email, password and role.",
      });
      return;
    }
    if (!isStaffRole(parsed.data.role)) {
      res.status(400).json({ error: "Choose a staff role." });
      return;
    }
    const companyKeys = await companyKeysFor(parsed.data.companyKeys || []);
    if (!companyKeys) {
      res.status(400).json({ error: "Choose companies from the list." });
      return;
    }
    const manager =
      parsed.data.role === "recruiter" ? await hiringManagerById(parsed.data.managerId) : null;
    if (parsed.data.role === "recruiter" && !manager) {
      res.status(400).json({ error: "Choose the hiring manager this recruiter reports to." });
      return;
    }
    const email = parsed.data.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const user = await User.create({
      email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
      companyKeys,
      managerId: manager?._id,
      managerHistory: manager
        ? [
            {
              managerId: manager._id,
              name: manager.name || manager.email || "",
              email: manager.email || "",
              startedAt: new Date(),
            },
          ]
        : [],
      profile: { name: parsed.data.name, email },
    });
    res.status(201).json({
      user: {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        companyKeys: user.companyKeys || [],
        managerId: user.managerId ? String(user.managerId) : null,
        managerName: manager?.name || manager?.email || "",
        managerHistory: serializeManagerHistory(user.managerHistory),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function patchStaffCompanies(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        companyKeys: z.array(z.string().trim().min(1)).max(50),
        managerId: z.string().trim().nullable().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Choose the companies this user covers." });
      return;
    }
    const companyKeys = await companyKeysFor(parsed.data.companyKeys);
    if (!companyKeys) {
      res.status(400).json({ error: "Choose companies from the list." });
      return;
    }
    const user = await User.findById(req.params.id);
    if (!user || (user.role !== "hiring_manager" && user.role !== "recruiter")) {
      res.status(404).json({ error: "Staff user not found." });
      return;
    }
    let managerName = user.managerId
      ? (await User.findById(user.managerId).select("name email"))?.name || ""
      : "";
    if (user.role === "recruiter" && parsed.data.managerId !== undefined) {
      const manager = await hiringManagerById(parsed.data.managerId);
      if (!manager) {
        res.status(400).json({ error: "Choose the hiring manager this recruiter reports to." });
        return;
      }
      managerName = await recordManagerAssignment(user, manager);
    }
    user.companyKeys = companyKeys;
    await user.save();
    res.json({
      user: {
        id: user._id.toString(),
        role: user.role,
        name: user.name || "",
        email: user.email || "",
        companyKeys: user.companyKeys || [],
        managerId: user.managerId ? String(user.managerId) : null,
        managerName,
        managerHistory: serializeManagerHistory(user.managerHistory),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listCategories(
  req: { query: Record<string, unknown> },
  res: Response,
  next: NextFunction,
) {
  try {
    const activeOnly = String(req.query.active || "") === "1";
    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.active = true;

    const [categories, counts] = await Promise.all([
      Category.find(filter).sort({ title: 1 }).limit(200),
      Job.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);
    const countMap = Object.fromEntries(
      counts.map((c) => [c._id, { total: c.count, active: c.active }]),
    );
    res.json({
      categories: categories.map((c) => ({
        id: c.key,
        key: c.key,
        title: c.title,
        subtitle: c.subtitle || "",
        color: c.color,
        active: c.active !== false,
        jobs: countMap[c.key]?.total || 0,
        activeJobs: countMap[c.key]?.active || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        title: z.string().trim().min(2).max(80),
        key: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        subtitle: z.string().trim().max(160).optional(),
        color: z.enum(companyColors).default("blue"),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid category payload.",
      });
      return;
    }
    const title = parsed.data.title;
    let key = parsed.data.key || slugify(title);
    if (!key) key = `cat-${Date.now().toString(36)}`;
    if (await Category.exists({ key })) {
      res
        .status(409)
        .json({ error: "A category with this key already exists." });
      return;
    }
    const category = await Category.create({
      key,
      title,
      subtitle: parsed.data.subtitle || "",
      color: parsed.data.color,
      icon: "briefcase",
      active: true,
    });
    res.status(201).json({
      category: {
        id: category.key,
        key: category.key,
        title: category.title,
        subtitle: category.subtitle || "",
        color: category.color,
        active: true,
        jobs: 0,
        activeJobs: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listLocations(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const counts = await Job.aggregate([
      {
        $group: {
          _id: "$pincode",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
          },
        },
      },
    ]);
    const countMap = Object.fromEntries(
      counts.map((c) => [c._id, { total: c.count, active: c.active }]),
    );
    res.json({
      locations: locationCatalog.map((l) => ({
        ...l,
        jobs: countMap[l.pincode]?.total || 0,
        activeJobs: countMap[l.pincode]?.active || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
}
