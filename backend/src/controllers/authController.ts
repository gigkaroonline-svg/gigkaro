import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { env, isAdminIdentifier } from "../config/env.js";
import { User } from "../models/User.js";
import { serializeUser, signToken } from "../middleware/auth.js";

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
  if (existingRole === "admin") return "admin" as const;
  if (requested === "admin") {
    if (!isAdminIdentifier(mobile, email)) {
      return null;
    }
    return "admin" as const;
  }
  return requested;
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
    const role = resolveRole(requestedRole, mobile, email);
    if (!role) {
      res.status(403).json({
        error: "This account is not allowed to sign in as admin.",
      });
      return;
    }

    const query = mobile ? { mobile } : { email: email!.toLowerCase() };
    let user = await User.findOne(query);
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
    } else if (user.role !== "admin") {
      if (role === "employer" || role === "admin") user.role = role;
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

    console.log(
      `[OTP] ${mobile || email} (${user.role}) → ${env.devOtp} (dev only; not sent via SMS)`,
    );

    res.json({
      ok: true,
      message: "OTP ready. Use the demo code for this environment.",
      otp: env.devOtp,
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

    const role = resolveRole(requestedRole, mobile, email, user.role);
    if (!role) {
      res.status(403).json({
        error: "This account is not allowed to sign in as admin.",
      });
      return;
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    if (user.role !== "admin") user.role = role;
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
