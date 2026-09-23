import { Router } from "express";
import { submitContact } from "../controllers/contactController.js";

export const contactRouter = Router();

contactRouter.post("/", submitContact);
