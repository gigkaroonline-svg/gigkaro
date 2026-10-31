import type { Metadata } from "next";
import { BlogArticleFromPath } from "@/features/blog";

// This route stays static. Reading the slug on the server makes the page
// render on demand, and that returns a 500 on Vercel. Posts included in the
// build are served by /blog/[slug] instead.
export const metadata: Metadata = {
  title: "Story",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BlogArticleFromPath />;
}
