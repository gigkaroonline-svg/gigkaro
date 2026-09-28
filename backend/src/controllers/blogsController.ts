import type { Response } from "express";
import { z } from "zod";
import { BlogPost, type BlogPostDoc } from "../models/BlogPost.js";
import type { AuthRequest } from "../middleware/auth.js";
import { deleteStoredCover, uploadBlogCover } from "../utils/gcs.js";

const coverUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), {
    message: "Cover image must be an http or https link.",
  });

const blogSchema = z.object({
  title: z.string().trim().min(3).max(140),
  excerpt: z.string().trim().min(20).max(320),
  body: z.string().trim().min(40).max(20000),
  coverUrl: coverUrl.optional(),
  status: z.enum(["draft", "published"]).optional(),
});

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "post";
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (
    await BlogPost.exists({
      slug,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    })
  ) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

async function coverFromRequest(req: AuthRequest) {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (file) return uploadBlogCover(file);
  if (req.body?.removeCover === "1" || req.body?.removeCover === "true") return "";
  if (typeof req.body?.coverUrl === "string") return req.body.coverUrl.trim();
  return undefined;
}

function serialize(post: BlogPostDoc, includeDraft = false) {
  return {
    id: post._id.toString(),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: includeDraft || post.status === "published" ? post.body : "",
    coverUrl: post.coverUrl || "",
    authorName: post.authorName || "GigKaro",
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
  };
}

export async function listPublishedBlogs(_req: AuthRequest, res: Response) {
  const posts = await BlogPost.find({ status: "published" }).sort({
    publishedAt: -1,
    createdAt: -1,
  });
  res.json({
    posts: posts.map((post) => {
      const item = serialize(post);
      return { ...item, body: "" };
    }),
  });
}

export async function getPublishedBlog(req: AuthRequest, res: Response) {
  const post = await BlogPost.findOne({
    slug: String(req.params.slug || ""),
    status: "published",
  });
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }
  res.json({ post: serialize(post) });
}

export async function listAdminBlogs(_req: AuthRequest, res: Response) {
  const posts = await BlogPost.find().sort({ updatedAt: -1 });
  res.json({ posts: posts.map((post) => serialize(post, true)) });
}

export async function createAdminBlog(req: AuthRequest, res: Response) {
  const parsed = blogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the title, excerpt and story." });
    return;
  }
  const status = parsed.data.status || "draft";
  let uploadedCover = "";
  try {
    uploadedCover = (await coverFromRequest(req)) || "";
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Could not upload the image.",
    });
    return;
  }
  const post = await BlogPost.create({
    title: parsed.data.title,
    slug: await uniqueSlug(parsed.data.title),
    excerpt: parsed.data.excerpt,
    body: parsed.data.body,
    coverUrl: uploadedCover,
    authorName: req.user?.name || "GigKaro",
    status,
    publishedAt: status === "published" ? new Date() : null,
  });
  res.status(201).json({ post: serialize(post, true) });
}

export async function patchAdminBlog(req: AuthRequest, res: Response) {
  const parsed = blogSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the title, excerpt and story." });
    return;
  }
  const post = await BlogPost.findById(String(req.params.id || ""));
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }
  if (parsed.data.title && parsed.data.title !== post.title) {
    post.title = parsed.data.title;
    if (post.status !== "published") {
      post.slug = await uniqueSlug(parsed.data.title, post._id.toString());
    }
  }
  if (parsed.data.excerpt !== undefined) post.excerpt = parsed.data.excerpt;
  if (parsed.data.body !== undefined) post.body = parsed.data.body;
  let uploadedCover: string | undefined;
  try {
    uploadedCover = await coverFromRequest(req);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Could not upload the image.",
    });
    return;
  }
  if (uploadedCover !== undefined && uploadedCover !== post.coverUrl) {
    await deleteStoredCover(post.coverUrl || "").catch(() => undefined);
    post.coverUrl = uploadedCover;
  }
  if (parsed.data.status) {
    post.status = parsed.data.status;
    if (parsed.data.status === "published" && !post.publishedAt) {
      post.publishedAt = new Date();
    }
  }
  await post.save();
  res.json({ post: serialize(post, true) });
}

export async function deleteAdminBlog(req: AuthRequest, res: Response) {
  const post = await BlogPost.findByIdAndDelete(String(req.params.id || ""));
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }
  res.json({ ok: true });
}
