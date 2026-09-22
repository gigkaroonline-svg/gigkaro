import type { Request, Response, NextFunction } from "express";
import {
  getIndiaPincode,
  nearestIndiaPincode,
  searchIndiaPincodes,
  serializeLocation,
} from "../utils/indiaPincodes.js";

export async function searchLocations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(25, Math.max(1, Number(req.query.limit) || 12));
    if (!q || q.length < 2) {
      res.json({ locations: [] });
      return;
    }

    const rows = searchIndiaPincodes(q, limit);
    res.json({ locations: rows.map(serializeLocation) });
  } catch (err) {
    next(err);
  }
}

export async function getLocationByPincode(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pin = String(req.params.pincode || "").trim();
    const row = getIndiaPincode(pin);
    if (!row) {
      res.status(404).json({ error: "Pincode not found." });
      return;
    }
    res.json({ location: serializeLocation(row) });
  } catch (err) {
    next(err);
  }
}

export async function nearestLocation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: "Provide lat and lng." });
      return;
    }

    const hit = nearestIndiaPincode(lat, lng);
    if (!hit) {
      res.status(404).json({ error: "No nearby pincode found." });
      return;
    }

    res.json({
      location: serializeLocation(hit.location),
      distanceKm: Math.round(hit.distanceKm * 10) / 10,
    });
  } catch (err) {
    next(err);
  }
}
