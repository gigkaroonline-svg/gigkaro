import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/features/blog";
import { apiAssetUrl } from "@/lib/api";
import { breadcrumbSchema, pageMetadata } from "@/lib/metadata";
import {
  fetchPublishedPost,
  fetchPublishedPosts,
} from "@/lib/services/api-blogs";

export const revalidate = 60;

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
  return pageMetadata(post.title, post.excerpt, `/blog/${post.slug}`);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPublishedPost(slug);
  if (!post) notFound();
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt || undefined,
    author: { "@type": "Person", name: post.authorName || "GigKaro" },
    ...(post.coverUrl ? { image: apiAssetUrl(post.coverUrl) } : {}),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
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
