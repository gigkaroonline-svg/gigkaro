import assert from "node:assert/strict";
import { test } from "node:test";
import { parseImageSize } from "../src/lib/image-size";

process.env.NEXT_PUBLIC_SITE_URL = "https://www.gigkaro.in";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://api.gigkaro.in/api").replace(
  /\/$/,
  "",
);
const HOME_OG = "gigkaro-home-og.jpg";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  coverUrl?: string | null;
  coverAlt?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function meta(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const name = /(?:property|name)=["']([^"']+)["']/i.exec(tag)?.[1];
    if (name !== key) continue;
    return decode(/content=["']([^"']*)["']/i.exec(tag)?.[1] || "");
  }
  return "";
}

function proseParagraphs(html: string) {
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) =>
      decode(match[1].replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function problemsForHtml(html: string, post: Post) {
  const problems: string[] = [];
  const canonicalTag = /<link[^>]*rel=["']canonical["'][^>]*>/i.exec(html)?.[0] || "";
  const canonical = /href=["']([^"']+)["']/i.exec(canonicalTag)?.[1] || "";
  let host = "";
  try {
    host = new URL(canonical).origin;
  } catch {
    host = canonical;
  }
  if (host !== "https://www.gigkaro.in") problems.push(`canonical host ${host || "missing"}`);
  if (meta(html, "og:type") !== "article") problems.push(`og:type ${meta(html, "og:type") || "missing"}`);
  const image = meta(html, "og:image");
  if (image.includes(HOME_OG)) problems.push(`og:image ${image}`);
  if (post.coverUrl && !image) problems.push("og:image missing");
  if (image && (!meta(html, "og:image:width") || !meta(html, "og:image:height"))) {
    problems.push("og:image size");
  }
  if (!meta(html, "article:published_time") || !html.includes("BlogPosting")) problems.push("article tags");
  const cover = /<img\b[^>]*(?:blog-cover|fetchpriority="high")[^>]*>/i.exec(html)?.[0] || "";
  if (cover && !/\balt="[^"]+"/.test(cover)) problems.push("cover image has no alt");
  if (post.coverUrl && !cover) problems.push("cover image missing");
  if (!/<h1[\s>]/i.test(html)) problems.push("no h1");
  const prose = html.match(/class="blog-prose"[^>]*>([\s\S]*?)<\/div>/)?.[1] || "";
  const headings = prose.match(/<h2[\s>]/gi)?.length || 0;
  if (headings < 2) problems.push(`h2 ${headings}`);
  const description = meta(html, "description");
  if (description.length > 155 || description.endsWith("…")) {
    problems.push(`description ${description.length}`);
  }
  for (const paragraph of proseParagraphs(prose)) {
    if (!/[.!?…]["'”’)\]]*$/.test(paragraph)) problems.push(`paragraph: ${paragraph.slice(0, 80)}`);
  }
  if (!/<time\b/i.test(html)) problems.push("missing time");
  if (!post.authorName?.trim() || !html.includes(post.authorName.trim())) problems.push("missing author");
  return problems;
}

test("png header yields width and height", () => {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, 1200);
  view.setUint32(20, 630);
  assert.deepEqual(parseImageSize(bytes), { width: 1200, height: 630 });
});

test("every blog post URL", async () => {
  const { articlePageMetadata } = await import("../src/lib/metadata");
  const { renderBlogBody } = await import("../src/lib/blog-html");
  const listed = await fetch(`${API}/blogs`);
  assert.equal(listed.ok, true, `blog list returned ${listed.status}`);
  const data = (await listed.json()) as { posts?: Post[] };
  const posts = data.posts || [];
  assert.ok(posts.length > 0, "no published posts");
  const failures: string[] = [];

  async function check(post: Post) {
    if (process.env.BLOG_ORIGIN) {
      const url = `${process.env.BLOG_ORIGIN.replace(/\/$/, "")}/blog/${post.slug}/`;
      const response = await fetch(url);
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${post.slug}: HTTP ${response.status}`);
        return;
      }
      const problems = problemsForHtml(html, post);
      if (problems.length) failures.push(`${post.slug}: ${problems.join("; ")}`);
      return;
    }

    const detail = await fetch(`${API}/blogs/${encodeURIComponent(post.slug)}`);
    if (!detail.ok) {
      failures.push(`${post.slug}: API ${detail.status}`);
      return;
    }
    const body = (await detail.json()) as { post?: Post };
    const full = body.post;
    if (!full?.body) {
      failures.push(`${post.slug}: missing body`);
      return;
    }
    const { readImageSize } = await import("../src/lib/image-size");
    const size = full.coverUrl ? await readImageSize(full.coverUrl) : null;
    const metadata = articlePageMetadata({
      title: full.title,
      excerpt: full.excerpt,
      slug: full.slug,
      image: full.coverUrl || undefined,
      imageAlt: full.coverAlt,
      imageWidth: size?.width,
      imageHeight: size?.height,
      publishedAt: full.publishedAt,
      updatedAt: full.updatedAt || full.publishedAt,
      authorUrl: full.authorUrl || "https://www.gigkaro.in/",
    });
    const canonical = String(metadata.alternates?.canonical || "");
    const images = metadata.openGraph?.images;
    const image = Array.isArray(images) ? images[0] : images;
    const imageUrl = typeof image === "string" ? image : image && "url" in image ? String(image.url) : "";
    const description = String(metadata.description || "");
    const rendered = renderBlogBody(full.body, full.title);
    const problems: string[] = [];
    if (!canonical.startsWith("https://www.gigkaro.in/")) problems.push(`canonical ${canonical}`);
    const openGraph = metadata.openGraph;
    const openGraphType = openGraph && "type" in openGraph ? openGraph.type : "";
    if (openGraphType !== "article") problems.push("og:type");
    if (full.coverUrl && (!imageUrl || imageUrl.includes(HOME_OG))) problems.push(`og:image ${imageUrl || "missing"}`);
    if (!full.coverUrl && imageUrl.includes(HOME_OG)) problems.push("og:image homepage");
    if (typeof image === "object" && image && "alt" in image && full.coverUrl && !String(image.alt || "").trim()) {
      problems.push("cover alt");
    }
    if (full.coverUrl && (typeof image !== "object" || !image || !("width" in image) || !("height" in image))) {
      problems.push("og:image size");
    }
    if (!full.title.trim()) problems.push("no h1");
    const headings = rendered.match(/<h2[\s>]/gi)?.length || 0;
    if (headings < 2) problems.push(`h2 ${headings}`);
    if (description.length > 155 || description.endsWith("…")) problems.push(`description ${description.length}`);
    for (const paragraph of proseParagraphs(rendered)) {
      if (!/[.!?…]["'”’)\]]*$/.test(paragraph)) problems.push(`paragraph: ${paragraph.slice(0, 80)}`);
    }
    if (!full.publishedAt) problems.push("missing time");
    if (!full.authorName?.trim()) problems.push("missing author");
    if (!metadata.other?.["article:published_time"]) problems.push("article:published_time");
    if (problems.length) failures.push(`${full.slug}: ${problems.join("; ")}`);
  }

  let index = 0;
  async function worker() {
    while (index < posts.length) {
      const post = posts[index];
      index += 1;
      await check(post);
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => worker()));
  assert.deepEqual(failures, []);
});
