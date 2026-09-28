import { Storage } from "@google-cloud/storage";
import { env } from "../config/env.js";

let client: Storage | null = null;

function storage() {
  if (client) return client;
  if (!env.gcsBucket) {
    throw new Error("Image storage is not configured.");
  }
  client = new Storage(
    env.gcsClientEmail && env.gcsPrivateKey
      ? {
          projectId: env.gcsProjectId || undefined,
          credentials: {
            client_email: env.gcsClientEmail,
            private_key: env.gcsPrivateKey,
          },
        }
      : { projectId: env.gcsProjectId || undefined },
  );
  return client;
}

function publicUrl(objectName: string) {
  return `https://storage.googleapis.com/${env.gcsBucket}/${objectName}`;
}

async function savePublicImage(
  folder: "blogs" | "companies",
  prefix: string,
  file: { buffer: Buffer; mimetype?: string; originalname?: string },
) {
  const ext = (file.originalname?.match(/\.[a-z0-9]+$/i)?.[0] || ".png")
    .toLowerCase()
    .replace(/[^.a-z0-9]/gi, "");
  const safeExt = ext.startsWith(".") ? ext : ".png";
  const objectName = `${folder}/${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  await storage()
    .bucket(env.gcsBucket)
    .file(objectName)
    .save(file.buffer, {
      resumable: false,
      contentType: file.mimetype || "image/png",
      metadata: { cacheControl: "public, max-age=31536000" },
    });
  return publicUrl(objectName);
}

export function uploadBlogCover(file: Express.Multer.File) {
  return savePublicImage("blogs", "cover", file);
}

export function uploadCompanyLogo(file: Express.Multer.File) {
  return savePublicImage("companies", "logo", file);
}

export function uploadCompanyLogoBuffer(
  buffer: Buffer,
  contentType: string,
  originalname: string,
) {
  return savePublicImage("companies", "logo", {
    buffer,
    mimetype: contentType,
    originalname,
  });
}

export async function deleteStoredCover(url: string) {
  if (!env.gcsBucket || !url) return;
  const prefix = `https://storage.googleapis.com/${env.gcsBucket}/`;
  if (!url.startsWith(prefix)) return;
  const objectName = decodeURIComponent(url.slice(prefix.length));
  if (!objectName.startsWith("blogs/")) return;
  await storage().bucket(env.gcsBucket).file(objectName).delete({ ignoreNotFound: true });
}
