import type { Metadata } from "next";
import { BlogArticleFromPath } from "@/features/blog";

export const metadata: Metadata = {
  title: "Story",
  description: "A story from GigKaro.",
};

export default function Page() {
  return <BlogArticleFromPath />;
}
