import "dotenv/config";
import mongoose from "mongoose";
import { renderBlogBody } from "../../frontend/src/lib/blog-html.ts";
import { BlogPost } from "../src/models/BlogPost.js";

function metaDescription(value: string, max = 155) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max + 1);
  const space = slice.lastIndexOf(" ");
  return (space > 40 ? slice.slice(0, space) : text.slice(0, max))
    .trimEnd()
    .replace(/[.,;:–—-]+$/, "");
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");
const dbKind = /localhost|127\.0\.0\.1/.test(uri) ? "local" : "remote";

await mongoose.connect(uri);
const posts = await BlogPost.find();
let descriptions = 0;
let bodies = 0;
for (const post of posts) {
  const nextDescription = metaDescription(post.excerpt || "");
  const nextBody = renderBlogBody(post.body || "", post.title || "");
  let changed = false;
  if ((post.metaDescription || "") !== nextDescription) {
    post.metaDescription = nextDescription;
    descriptions += 1;
    changed = true;
  }
  if (nextBody && nextBody !== post.body) {
    post.body = nextBody;
    bodies += 1;
    changed = true;
  }
  if (changed) await post.save();
}
const sample = posts.find((post) => post.slug === "india-gig-hiring-startups-complete-market-map");
const api = sample
  ? await fetch(`https://api.gigkaro.in/api/blogs/${sample.slug}`).then((res) => res.json())
  : null;
const apiBody = api?.post?.body || "";
console.log(
  `Database is ${dbKind}. Rewrote ${bodies} bodies and ${descriptions} descriptions of ${posts.length} posts. Live API body matches this database: ${apiBody === sample?.body}`,
);
await mongoose.disconnect();
