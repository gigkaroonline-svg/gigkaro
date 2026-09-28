import { usingMemoryDb } from "../config/db.js";
import { BlogPost } from "../models/BlogPost.js";

const slug = "how-to-find-gig-work-near-you";

export async function seedDummyBlogIfEmpty() {
  if (usingMemoryDb) return;
  if ((await BlogPost.countDocuments()) > 0) return;
  await BlogPost.create({
    title: "How to find gig work near you",
    slug,
    excerpt:
      "A simple way to look for delivery, warehouse and field work by pincode, and what to keep ready before you apply.",
    body: [
      "Start with the place you already live. A pincode search shows roles that are close enough to reach without a long commute.",
      "Look at the pay, the shift and whether a bike is required before you apply. Those three details tell you if the work fits the week you actually have.",
      "Keep your Aadhaar, a working phone number and a recent photo handy. Most local hiring moves faster when those are ready on the first day.",
      "If a role says it is open across locations, read the city on the page carefully. The listing can appear in more than one search, but the team still hires for a real neighbourhood.",
    ].join("\n\n"),
    coverUrl: "",
    authorName: "GigKaro",
    status: "published",
    publishedAt: new Date(),
  });
  console.log(`Seeded blog post ${slug}`);
}
