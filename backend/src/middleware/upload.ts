import fs from "fs";
import path from "path";
import multer from "multer";
import type { RequestHandler } from "express";

const uploadRoot = path.resolve(process.cwd(), "uploads", "companies");

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const safe = ext.replace(/[^.a-z0-9]/gi, "") || ".png";
    cb(null, `logo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safe}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Logo must be an image file."));
    return;
  }
  cb(null, true);
}

export const companyLogoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("logo");

export const optionalCompanyLogo: RequestHandler = (req, res, next) => {
  companyLogoUpload(req, res, (err) => {
    if (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Could not upload logo.",
      });
      return;
    }
    next();
  });
};

export function companyLogoPublicPath(filename: string) {
  return `/uploads/companies/${filename}`;
}
