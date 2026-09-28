import { BlogIndex } from "@/features/blog";
import { pageMetadata } from "@/lib/metadata";
import { fetchPublishedPosts } from "@/lib/services/api-blogs";

export const revalidate = 60;

export const metadata = pageMetadata(
  "Blog",
  "Stories and practical advice from GigKaro on nearby gig work, local hiring and getting paid.",
  "/blog",
);

export default async function Page() {
  const posts = await fetchPublishedPosts();
  return <BlogIndex posts={posts} />;
}
