import { Router } from "express";
import { collectAnalytics } from "../controllers/analyticsController.js";

export const analyticsRouter = Router();

analyticsRouter.post("/collect", collectAnalytics);
