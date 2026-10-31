import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/features/blog";
import { apiAssetUrl } from "@/lib/api";
import { articlePageMetadata, blogPostingSchema, breadcrumbSchema } from "@/lib/metadata";
import {
  fetchPublishedPost,
} from "@/lib/services/api-blogs";

function slugParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const slug = raw?.trim() || "";
  if (!slug || slug === "view" || slug === "blog") return "";
  return slug;
}

async function loadPost(slug: string) {
  if (!slug) return null;
  const post = await fetchPublishedPost(slug);
  return post ?? null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await searchParams;
  const post = await loadPost(slugParam(slug));
  if (!post) {
    return { title: "Story", robots: { index: false, follow: false } };
  }
  return articlePageMetadata({
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    image: post.coverUrl ? apiAssetUrl(post.coverUrl) : undefined,
  });
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}) {
  const { slug } = await searchParams;
  const post = await loadPost(slugParam(slug));
  if (!post) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            blogPostingSchema({
              title: post.title,
              excerpt: post.excerpt,
              slug: post.slug,
              publishedAt: post.publishedAt,
              updatedAt: post.updatedAt,
              authorName: post.authorName,
              image: post.coverUrl ? apiAssetUrl(post.coverUrl) : undefined,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ]),
          ),
        }}
      />
      <BlogArticle post={post} />
    </>
  );
}
