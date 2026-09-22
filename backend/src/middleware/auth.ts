import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, type UserDoc } from "../models/User.js";

export type AuthRequest = Request & {
  user?: UserDoc;
  userId?: string;
};

type JwtPayload = { sub: string; role: string };

export function signToken(user: UserDoc) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: "7d" },
  );
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as JwtPayload;
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function requireRole(
  ...roles: Array<"candidate" | "employer" | "admin">
) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!roles.includes(req.user.role as (typeof roles)[number])) {
      res.status(403).json({ error: "Insufficient permissions." });
      return;
    }
    next();
  };
}

export function serializeUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name || user.profile?.name || "",
    mobile: user.mobile || user.profile?.mobile || "",
    email: user.email || user.profile?.email || "",
    profile: user.profile,
  };
}
