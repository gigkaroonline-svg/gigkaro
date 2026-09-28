import multer from "multer";
import type { RequestHandler } from "express";

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
  storage: multer.memoryStorage(),
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

const blogCoverUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Cover must be an image file."));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("cover");

export const optionalBlogCover: RequestHandler = (req, res, next) => {
  blogCoverUpload(req, res, (err) => {
    if (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Could not upload the image.",
      });
      return;
    }
    next();
  });
};

