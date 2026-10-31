import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { env, isAdminIdentifier } from "../config/env.js";
import { isStaffRole } from "../auth/roles.js";
import { User } from "../models/User.js";
import { serializeUser, signToken } from "../middleware/auth.js";
import { verifyPassword } from "../utils/password.js";

const roleSchema = z.enum(["candidate", "employer", "admin"]);

const requestOtpSchema = z
  .object({
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/)
      .optional(),
    email: z.string().email().optional(),
    role: roleSchema.default("candidate"),
  })
  .refine((v) => !!v.mobile || !!v.email, {
    message: "Provide a mobile number or email.",
  });

const verifyOtpSchema = z
  .object({
    mobile: z.string().optional(),
    email: z.string().email().optional(),
    otp: z.string().min(4),
    role: roleSchema.default("candidate"),
  })
  .refine((v) => !!v.mobile || !!v.email, {
    message: "Provide a mobile number or email.",
  });

function resolveRole(
  requested: "candidate" | "employer" | "admin",
  mobile?: string,
  email?: string,
  existingRole?: string,
) {
  if (isStaffRole(existingRole)) return existingRole;
  if (requested === "admin") {
    if (!isAdminIdentifier(mobile, email)) {
      return null;
    }
    return "admin" as const;
  }
  return requested;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(100),
});

export async function loginWithPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter your email and password." });
      return;
    }
    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !isStaffRole(user.role) || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const token = signToken(user);
    res.json({ token, user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = requestOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    const { mobile, email, role: requestedRole } = parsed.data;
    const query = mobile ? { mobile } : { email: email!.toLowerCase() };
    let user = await User.findOne(query);
    if (user && isStaffRole(user.role)) {
      res.status(400).json({
        error: "This account signs in with email and password.",
      });
      return;
    }
    if (requestedRole === "admin") {
      res.status(400).json({
        error: "Staff accounts sign in with email and password.",
      });
      return;
    }
    const role = resolveRole(requestedRole, mobile, email);
    if (!role) {
      res.status(403).json({
        error: "This account is not allowed to sign in as admin.",
      });
      return;
    }
    if (!user) {
      user = await User.create({
        ...query,
        role,
        name: role === "admin" ? "GigKaro Admin" : "",
        profile: {
          ...(mobile ? { mobile } : { email: email!.toLowerCase() }),
          name: role === "admin" ? "GigKaro Admin" : "",
        },
      });
    } else if (!isStaffRole(user.role)) {
      if (role === "employer") user.role = role;
      else if (role === "candidate" && user.role !== "employer")
        user.role = "candidate";
    }

    user.otp = env.devOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    if (mobile) {
      user.mobile = mobile;
      user.profile.mobile = mobile;
    }
    if (email) {
      user.email = email.toLowerCase();
      user.profile.email = email.toLowerCase();
    }
    await user.save();

    console.log(`[OTP] ${mobile || email} (${user.role})`);

    res.json({
      ok: true,
      message: "Enter the 6-digit code to continue.",
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }
    const { mobile, email, otp, role: requestedRole } = parsed.data;
    const query = mobile ? { mobile } : { email: email!.toLowerCase() };
    const user = await User.findOne(query);
    if (!user || !user.otp || !user.otpExpires) {
      res.status(400).json({ error: "Request an OTP first." });
      return;
    }
    if (user.otpExpires.getTime() < Date.now()) {
      res.status(400).json({ error: "OTP expired. Request a new one." });
      return;
    }
    if (otp !== user.otp) {
      res.status(400).json({ error: "Invalid OTP." });
      return;
    }

    if (isStaffRole(user.role)) {
      res.status(400).json({
        error: "This account signs in with email and password.",
      });
      return;
    }
    const role = resolveRole(requestedRole, mobile, email, user.role);
    if (!role || role === "admin") {
      res.status(400).json({
        error: "Staff accounts sign in with email and password.",
      });
      return;
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    if (!isStaffRole(user.role)) user.role = role;
    await user.save();

    const token = signToken(user);
    res.json({ token, user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  const user = (req as import("../middleware/auth.js").AuthRequest).user!;
  res.json({ user: serializeUser(user) });
}
