import { Router } from "express";
import {
  requestOtp,
  verifyOtp,
  loginWithPassword,
  me,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/request-otp", requestOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/login", loginWithPassword);
authRouter.get("/me", requireAuth, me);
