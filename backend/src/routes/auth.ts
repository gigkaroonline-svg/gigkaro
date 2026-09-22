import { Router } from "express";
import { requestOtp, verifyOtp, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/request-otp", requestOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.get("/me", requireAuth, me);
