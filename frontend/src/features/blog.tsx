"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/primitives";
import { API_URL, apiAssetUrl } from "@/lib/api";
import { looksLikeBlogHtml, sanitizeBlogHtml } from "@/lib/blog-html";
import { BLOG_PAGE_SIZE, blogListHref } from "@/lib/blog-list";
import {
  formatBlogDate,
  type BlogPost,
} from "@/lib/services/api-blogs";

function BlogPager({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav className="blog-pager" aria-label="Blog pages">
      {page <= 1 ? (
        <button type="button" className="button button-outline" disabled>
          Previous
        </button>
      ) : (
        <Link className="button button-outline" href={blogListHref(page - 1)}>
          Previous
        </Link>
      )}
      <span>
        Page {page} of {pages}
      </span>
      {page >= pages ? (
        <button type="button" className="button button-outline" disabled>
          Next
        </button>
      ) : (
        <Link className="button button-outline" href={blogListHref(page + 1)}>
          Next
        </Link>
      )}
    </nav>
  );
}

export function BlogIndex({
  posts: initialPosts,
  page,
  pages: initialPages,
}: {
  posts: BlogPost[];
  page: number;
  pages: number;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [pages, setPages] = useState(initialPages);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/blogs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { posts?: BlogPost[] } | null) => {
        if (cancelled || !data?.posts?.length) return;
        const nextPages = Math.max(
          1,
          Math.ceil(data.posts.length / BLOG_PAGE_SIZE),
        );
        const start = (page - 1) * BLOG_PAGE_SIZE;
        setPages(nextPages);
        setPosts(data.posts.slice(start, start + BLOG_PAGE_SIZE));
      })
      .catch(() => {
        // keep server-rendered posts
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumb items={[{ label: "Blog" }]} />
          <h1>Stories from the gig economy</h1>
          <p>
            Practical notes on finding nearby work, hiring locally, and getting
            paid for a day’s effort.
          </p>
        </div>
      </div>
      <div className="container page-content">
        {posts.length === 0 ? (
          <div className="empty-state">
            <h2>No stories yet</h2>
            <p>New posts will appear here once they are published.</p>
          </div>
        ) : (
          <>
            <div className="blog-grid">
              {posts.map((post) => (
                <article className="blog-card" key={post.id}>
                  {post.coverUrl ? (
                    <img
                      src={apiAssetUrl(post.coverUrl)}
                      alt={post.title}
                      className="blog-card-cover"
                    />
                  ) : null}
                  <div className="blog-card-body">
                    <p className="blog-meta">
                      {formatBlogDate(post.publishedAt)}
                      {post.authorName ? ` · ${post.authorName}` : ""}
                    </p>
                    <h2>
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="blog-card-excerpt">{post.excerpt}</p>
                    <Link className="text-link" href={`/blog/${post.slug}`}>
                      Read story
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <BlogPager page={page} pages={pages} />
          </>
        )}
      </div>
    </>
  );
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const htmlBody = looksLikeBlogHtml(post.body)
    ? sanitizeBlogHtml(post.body)
    : null;
  const paragraphs = htmlBody
    ? []
    : (post.body || "")
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(Boolean);
  return (
    <>
      <div className="page-intro">
        <div className="container blog-article-intro">
          <Breadcrumb
            items={[
              { label: "Blog", href: "/blog" },
              { label: post.title },
            ]}
          />
          <p className="blog-meta">
            {formatBlogDate(post.publishedAt)}
            {post.authorName ? ` · ${post.authorName}` : ""}
          </p>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </div>
      </div>
      <article className="container page-content blog-article">
        {post.coverUrl ? (
          <img
            src={apiAssetUrl(post.coverUrl)}
            alt={post.title}
            className="blog-cover"
          />
        ) : null}
        {htmlBody ? (
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: htmlBody }}
          />
        ) : (
          <div className="blog-prose">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
        <Link className="text-link" href="/blog">
          All stories
        </Link>
      </article>
    </>
  );
}
