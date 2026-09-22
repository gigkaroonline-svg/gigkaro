import { Router } from "express";
import {
  searchLocations,
  getLocationByPincode,
  nearestLocation,
} from "../controllers/locationsController.js";

export const locationsRouter = Router();

locationsRouter.get("/search", searchLocations);
locationsRouter.get("/nearest", nearestLocation);
locationsRouter.get("/:pincode", getLocationByPincode);
