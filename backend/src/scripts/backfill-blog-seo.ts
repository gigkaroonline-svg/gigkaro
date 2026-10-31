import "dotenv/config";
import mongoose from "mongoose";
import { BlogPost } from "../models/BlogPost.js";

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

await mongoose.connect(uri);
const posts = await BlogPost.find();
let updated = 0;
for (const post of posts) {
  const next = metaDescription(post.excerpt || "");
  if ((post.metaDescription || "") === next) continue;
  post.metaDescription = next;
  await post.save();
  updated += 1;
}
console.log(`Recomputed meta descriptions for ${updated} of ${posts.length} blog posts`);
await mongoose.disconnect();
