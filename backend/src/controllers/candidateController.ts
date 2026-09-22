import type { Response, NextFunction } from "express";
import { z } from "zod";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { SavedJob } from "../models/SavedJob.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.js";
import { serializeUser } from "../middleware/auth.js";
import { serializeJob } from "../utils/jobs.js";

const applicationBody = z.object({
  jobId: z.string().min(1),
  name: z.string().trim().min(2),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  pincode: z.string().regex(/^[1-9]\d{5}$/),
  bike: z.string().min(1),
  licence: z.string().min(1),
  joining: z.string().min(1),
});

const profileBody = z.object({
  name: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  pincode: z.string().optional(),
  city: z.string().optional(),
  radius: z.string().optional(),
  category: z.string().optional(),
  employmentType: z.string().optional(),
  shift: z.string().optional(),
  vehicle: z.string().optional(),
  licence: z.string().optional(),
  dob: z.string().optional(),
});

function serializeApplication(
  app: {
    _id: { toString(): string };
    jobId: unknown;
    name: string;
    mobile: string;
    pincode: string;
    bike: string;
    licence: string;
    joining: string;
    status: string;
    createdAt?: Date;
  },
  job?: ReturnType<typeof serializeJob> | null,
) {
  const jobId =
    typeof app.jobId === "object" &&
    app.jobId &&
    "_id" in (app.jobId as object)
      ? (app.jobId as { _id: { toString(): string } })._id.toString()
      : String(app.jobId);
  return {
    id: app._id.toString(),
    jobId,
    name: app.name,
    mobile: app.mobile,
    pincode: app.pincode,
    bike: app.bike,
    licence: app.licence,
    joining: app.joining,
    status: app.status,
    createdAt: app.createdAt?.toISOString?.() ?? new Date().toISOString(),
    job: job ?? undefined,
  };
}

export async function listApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const apps = await Application.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("jobId");
    res.json({
      applications: apps.map((a) => {
        const populated = a.jobId as unknown as
          | (Parameters<typeof serializeJob>[0] & { status?: string })
          | null;
        const job =
          populated && typeof populated === "object" && "slug" in populated
            ? serializeJob(populated)
            : null;
        return serializeApplication(a, job);
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function createApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = applicationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    const job = await Job.findById(parsed.data.jobId);
    if (!job || job.status !== "Active") {
      res.status(404).json({ error: "Job not available." });
      return;
    }

    const existing = await Application.findOne({
      $or: [
        ...(req.userId
          ? [{ userId: req.userId, jobId: job._id }]
          : []),
        { mobile: parsed.data.mobile, jobId: job._id },
      ],
    });
    if (existing) {
      res.status(409).json({
        error: "You already applied to this job.",
        application: serializeApplication(existing, serializeJob(job)),
      });
      return;
    }

    const app = await Application.create({
      ...parsed.data,
      ...(req.userId ? { userId: req.userId } : {}),
      jobId: job._id,
      status: "Applied",
    });

    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, {
        $set: {
          name: parsed.data.name,
          "profile.name": parsed.data.name,
          "profile.mobile": parsed.data.mobile,
          "profile.pincode": parsed.data.pincode,
          mobile: parsed.data.mobile,
        },
      });
    }

    res.status(201).json({
      application: serializeApplication(app, serializeJob(job)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getApplication(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const app = await Application.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate("jobId");
    if (!app) {
      res.status(404).json({ error: "Application not found." });
      return;
    }
    const populated = app.jobId as unknown as
      | Parameters<typeof serializeJob>[0]
      | null;
    const job =
      populated && typeof populated === "object" && "slug" in populated
        ? serializeJob(populated)
        : null;
    res.json({ application: serializeApplication(app, job) });
  } catch (err) {
    next(err);
  }
}

export async function listSaved(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await SavedJob.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("jobId")
      .lean();
    const jobs = rows
      .map((r) => r.jobId as unknown)
      .filter((j): j is Parameters<typeof serializeJob>[0] => {
        return !!j && typeof j === "object" && j !== null && "slug" in j;
      })
      .map((j) => serializeJob(j));
    res.json({
      saved: rows.map((r) => {
        const j = r.jobId;
        const jobId =
          j && typeof j === "object" && "_id" in j
            ? String((j as { _id: unknown })._id)
            : String(j);
        return {
          id: String(r._id),
          jobId,
        };
      }),
      jobs,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }
    await SavedJob.findOneAndUpdate(
      { userId: req.userId, jobId: job._id },
      { userId: req.userId, jobId: job._id },
      { upsert: true, new: true },
    );
    res.json({ ok: true, jobId: job._id.toString() });
  } catch (err) {
    next(err);
  }
}

export async function unsaveJob(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await SavedJob.deleteOne({
      userId: req.userId,
      jobId: req.params.jobId,
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    res.json({ user: serializeUser(req.user!) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = profileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const data = parsed.data;
    if (data.name !== undefined) {
      user.name = data.name;
      user.profile.name = data.name;
    }
    if (data.mobile !== undefined) {
      user.mobile = data.mobile;
      user.profile.mobile = data.mobile;
    }
    if (data.email !== undefined) {
      user.email = data.email || undefined;
      user.profile.email = data.email;
    }
    const profileKeys = [
      "pincode",
      "city",
      "radius",
      "category",
      "employmentType",
      "shift",
      "vehicle",
      "licence",
      "dob",
    ] as const;
    for (const key of profileKeys) {
      if (data[key] !== undefined) {
        (user.profile as Record<string, string>)[key] = data[key] as string;
      }
    }
    await user.save();
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
}
