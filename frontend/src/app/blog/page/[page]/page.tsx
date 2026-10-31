import { notFound } from "next/navigation";
import { BlogListing, blogListingMetadata, blogPageCount } from "../../listing";
import { fetchPublishedPosts } from "@/lib/services/api-blogs";

export const revalidate = 30;
// Pages that were not built must not render on demand. That returns a 500 on Vercel.
export const dynamicParams = false;

function pageNumber(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  if (page < 2) return null;
  return page;
}

export async function generateStaticParams() {
  const posts = await fetchPublishedPosts();
  const pages = blogPageCount(posts.length);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: raw } = await params;
  const page = pageNumber(raw);
  if (page == null) {
    return { title: "Blog", robots: { index: false, follow: false } };
  }
  return blogListingMetadata(page);
}

export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: raw } = await params;
  const page = pageNumber(raw);
  if (page == null) notFound();
  return <BlogListing page={page} />;
}
