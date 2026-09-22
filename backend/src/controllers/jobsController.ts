import type { Request, Response, NextFunction } from "express";
import { Job } from "../models/Job.js";
import { distanceKm, serializeJob } from "../utils/jobs.js";
import {
  getIndiaPincode,
  searchIndiaPincodes,
} from "../utils/indiaPincodes.js";

type LocationRef = {
  pincode: string;
  locality: string;
  city: string;
  lat: number;
  lng: number;
};

function findOrigin(location: string): LocationRef | undefined {
  const q = location.trim();
  if (!q) return undefined;

  if (/^\d{6}$/.test(q)) {
    const pin = getIndiaPincode(q);
    if (pin) {
      return {
        pincode: pin.pincode,
        locality: pin.locality,
        city: pin.city,
        lat: pin.lat || 0,
        lng: pin.lng || 0,
      };
    }
  }

  const hits = searchIndiaPincodes(q, 1);
  const hit = hits[0];
  if (!hit) return undefined;
  return {
    pincode: hit.pincode,
    locality: hit.locality,
    city: hit.city,
    lat: hit.lat || 0,
    lng: hit.lng || 0,
  };
}

export async function listJobs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const f = {
      location: String(req.query.location || ""),
      category: String(req.query.category || ""),
      radius: String(req.query.radius || ""),
      salary: String(req.query.salary || ""),
      type: String(req.query.type || ""),
      vehicle: String(req.query.vehicle || ""),
      shift: String(req.query.shift || ""),
      immediate:
        req.query.immediate === "true" || req.query.immediate === "1",
      sort: String(req.query.sort || "recommended"),
    };

    const jobs = await Job.find({ status: "Active" }).lean();
    const q = f.location.trim().toLowerCase();
    const origin = findOrigin(f.location);
    const isPin = /^\d+$/.test(q);

    let results = jobs
      .map((j) => {
        const dist = origin
          ? Math.round(distanceKm(origin, j) * 10) / 10
          : j.distanceKm;
        return {
          job: j,
          distanceKm: dist,
          distanceFromSearch: !!origin,
        };
      })
      .filter(({ job: j, distanceKm: d }) => {
        if (q && !j.showEverywhere) {
          if (origin) {
            if (f.radius === "0" ? j.pincode !== origin.pincode : d > Number(f.radius || 10))
              return false;
          } else if (
            isPin
              ? j.pincode !== q
              : ![j.city, j.locality].some((v) => v.toLowerCase().includes(q)) &&
                !(q === "delhi" && j.city === "Delhi NCR")
          )
            return false;
        }
        if (f.category && j.category !== f.category) return false;
        if (f.salary) {
          const [min, max] = f.salary.split("-").map(Number);
          if (j.salaryMax < min || (max && j.salaryMin > max)) return false;
        }
        return (
          (!f.type || j.employmentType === f.type) &&
          (!f.vehicle || j.vehicle === f.vehicle) &&
          (!f.shift || j.shift === f.shift) &&
          (!f.immediate || j.immediateJoining)
        );
      });

    if (f.sort === "salary") {
      results = results.sort((a, b) => b.job.salaryMax - a.job.salaryMax);
    } else if (f.sort === "distance" && origin) {
      results = results.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json({
      jobs: results.map(({ job, distanceKm: d, distanceFromSearch }) => {
        // Nationwide roles surface under the searched pin, not the seed locality.
        if (job.showEverywhere && origin) {
          return serializeJob(job as never, {
            locality: origin.locality,
            city: origin.city,
            pincode: origin.pincode,
            lat: origin.lat,
            lng: origin.lng,
            distanceKm: 0,
            distanceFromSearch: true,
          });
        }
        return serializeJob(job as never, {
          distanceKm: d,
          distanceFromSearch,
        });
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function getJobBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const job = await Job.findOne({ slug: req.params.slug, status: "Active" });
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }
    res.json({ job: serializeJob(job) });
  } catch (err) {
    next(err);
  }
}

export async function getJobsByPincode(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const jobs = await Job.find({
      status: "Active",
      $or: [{ pincode: req.params.pincode }, { showEverywhere: true }],
    });
    res.json({ jobs: jobs.map((j) => serializeJob(j)) });
  } catch (err) {
    next(err);
  }
}
