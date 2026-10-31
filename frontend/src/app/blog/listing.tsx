import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/features/blog";
import { BLOG_PAGE_SIZE } from "@/lib/blog-list";
import {
  breadcrumbSchema,
  canonicalUrl,
  pageMetadata,
} from "@/lib/metadata";
import { fetchPublishedPosts } from "@/lib/services/api-blogs";

const description =
  "Stories and practical advice from GigKaro on nearby gig work, local hiring and getting paid.";

export function blogPageCount(total: number) {
  return Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
}

function blogListUrl(page: number) {
  return canonicalUrl(page <= 1 ? "/blog" : `/blog/page/${page}`);
}

export async function blogListingMetadata(page: number): Promise<Metadata> {
  const posts = await fetchPublishedPosts();
  const pages = blogPageCount(posts.length);
  if (page < 1 || page > pages) {
    return { title: "Blog", robots: { index: false, follow: false } };
  }
  const metadata = pageMetadata(
    page <= 1 ? "Blog" : `Blog, page ${page}`,
    description,
    page <= 1 ? "/blog" : `/blog/page/${page}`,
  );
  return {
    ...metadata,
    pagination: {
      previous: page > 1 ? blogListUrl(page - 1) : undefined,
      next: page < pages ? blogListUrl(page + 1) : undefined,
    },
  };
}

export async function BlogListing({ page }: { page: number }) {
  const posts = await fetchPublishedPosts();
  const pages = blogPageCount(posts.length);
  if (page < 1 || page > pages) notFound();
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
