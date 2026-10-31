import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/features/blog";
import { apiAssetUrl } from "@/lib/api";
import { relatedStories } from "@/lib/blog-list";
import { readImageSize } from "@/lib/image-size";
import { articlePageMetadata, articleSchemaGraph, siteOrigin } from "@/lib/metadata";
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

function authorLink(name?: string | null, url?: string | null) {
  if (url?.trim()) return url.trim();
  if (/^(gigkaro|gigkaro admin)$/i.test(name?.trim() || "")) return `${siteOrigin}/`;
  return "";
}

function warnMissingSeo(post: {
  slug: string;
  publishedAt?: string | null;
  authorName?: string | null;
  coverUrl?: string | null;
}) {
  const missing = [
    !post.publishedAt ? "date" : "",
    !post.authorName?.trim() ? "author" : "",
    !post.coverUrl?.trim() ? "image" : "",
  ].filter(Boolean);
  if (missing.length) {
    console.error(`Blog post ${post.slug} is missing ${missing.join(", ")}`);
  }
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
  warnMissingSeo(post);
  const image = post.coverUrl ? apiAssetUrl(post.coverUrl) : undefined;
  const size = image ? await readImageSize(image) : null;
  return articlePageMetadata({
    title: post.title,
    excerpt: post.excerpt,
    metaDescription: post.metaDescription,
    slug: post.slug,
    image,
    imageAlt: post.coverAlt,
    imageWidth: size?.width,
    imageHeight: size?.height,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt || post.publishedAt,
    authorName: post.authorName,
    authorUrl: authorLink(post.authorName, post.authorUrl),
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
  warnMissingSeo(post);
  const related = relatedStories(await fetchPublishedPosts(), post.slug);
  const authorUrl = authorLink(post.authorName, post.authorUrl);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleSchemaGraph({
              title: post.title,
              excerpt: post.excerpt,
              metaDescription: post.metaDescription,
              slug: post.slug,
              publishedAt: post.publishedAt,
              updatedAt: post.updatedAt || post.publishedAt,
              authorName: post.authorName,
              authorUrl,
              image: post.coverUrl ? apiAssetUrl(post.coverUrl) : undefined,
            }),
          ),
        }}
      />
      <BlogArticle post={{ ...post, authorUrl }} related={related} />
    </>
  );
}
