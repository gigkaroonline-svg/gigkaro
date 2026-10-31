import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/features/blog";
import { apiAssetUrl } from "@/lib/api";
import { articlePageMetadata, blogPostingSchema, breadcrumbSchema } from "@/lib/metadata";
import {
  fetchPublishedPost,
  fetchPublishedPosts,
} from "@/lib/services/api-blogs";

export const revalidate = 30;
// Slugs missing from the build are rewritten to /blog/view.
// Rendering them in this route returns a 500 on Vercel.
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await fetchPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublishedPost(slug);
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
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPublishedPost(slug);
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
