import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogIndex } from "@/features/blog";
import { BLOG_PAGE_SIZE } from "@/lib/blog-list";
import {
  breadcrumbSchema,
  canonicalUrl,
  pageMetadata,
} from "@/lib/metadata";
import { fetchPublishedPosts } from "@/lib/services/api-blogs";

export const revalidate = 30;

const description =
  "Stories and practical advice from GigKaro on nearby gig work, local hiring and getting paid.";

function requestedPage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === "") return 1;
  if (!/^\d+$/.test(raw)) return null;
  const page = Number(raw);
  if (page === 1) return 1;
  if (page < 1) return null;
  return page;
}

function blogListUrl(page: number) {
  const base = canonicalUrl("/blog");
  return page <= 1 ? base : `${base}?page=${page}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}): Promise<Metadata> {
  const { page: pageValue } = await searchParams;
  const page = requestedPage(pageValue);
  const posts = await fetchPublishedPosts();
  const pages = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  if (page == null || page > pages) {
    return { title: "Blog", robots: { index: false, follow: false } };
  }
  const metadata = pageMetadata(
    page <= 1 ? "Blog" : `Blog, page ${page}`,
    description,
    "/blog",
  );
  return {
    ...metadata,
    alternates: { canonical: blogListUrl(page) },
    openGraph: { ...metadata.openGraph, url: blogListUrl(page) },
    pagination: {
      previous: page > 1 ? blogListUrl(page - 1) : undefined,
      next: page < pages ? blogListUrl(page + 1) : undefined,
    },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: pageValue } = await searchParams;
  const raw = Array.isArray(pageValue) ? pageValue[0] : pageValue;
  const page = requestedPage(pageValue);
  if (raw === "1") permanentRedirect("/blog/");
  const posts = await fetchPublishedPosts();
  const pages = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  if (page == null || page > pages) notFound();
  const visible = posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
            ]),
          ),
        }}
      />
      <BlogIndex key={page} posts={visible} page={page} pages={pages} />
    </>
  );
}
