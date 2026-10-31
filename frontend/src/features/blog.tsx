"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumb, EmptyState } from "@/components/primitives";
import { API_URL, apiAssetUrl } from "@/lib/api";
import { looksLikeBlogHtml, sanitizeBlogHtml } from "@/lib/blog-html";
import {
  formatBlogDate,
  type BlogPost,
} from "@/lib/services/api-blogs";

const PAGE_SIZE = 12;

function BlogPager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="blog-pager" aria-label="Blog pages">
      <button
        type="button"
        className="button button-outline"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className="button button-outline"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}

export function BlogIndex({ posts: initialPosts }: { posts: BlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/blogs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { posts?: BlogPost[] } | null) => {
        if (cancelled || !data?.posts?.length) return;
        setPosts(data.posts);
      })
      .catch(() => {
        // keep server-rendered posts
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = posts.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function go(next: number) {
    setPage(next);
    document.querySelector(".page-intro")?.scrollIntoView({ block: "start" });
  }

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
              {visible.map((post) => (
                <article className="blog-card" key={post.id}>
                  {post.coverUrl ? (
                    <img
                      src={apiAssetUrl(post.coverUrl)}
                      alt=""
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
            <BlogPager page={current} pages={pages} onPage={go} />
          </>
        )}
      </div>
    </>
  );
}

export function BlogArticleFromPath() {
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    const slug = window.location.pathname.split("/").filter(Boolean).at(-1);
    if (!slug || slug === "view" || slug === "blog") {
      setPost(null);
      return;
    }
    let cancelled = false;
    fetch(`${API_URL}/blogs/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as { post?: BlogPost };
      })
      .then((data) => {
        if (!cancelled) setPost(data.post ?? null);
      })
      .catch(() => {
        if (!cancelled) setPost(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!post?.title) return;
    document.title = `${post.title} | GigKaro`;
  }, [post]);

  if (post === undefined) {
    return (
      <div
        className="container page-content"
        aria-label="Loading story"
        role="status"
      >
        <div className="skeleton short" />
        <div className="skeleton tall" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container page-content">
        <EmptyState
          title="This story isn't available."
          description="The link may be wrong, or this story is no longer published."
        >
          <Link className="button button-primary" href="/blog">
            All stories
          </Link>
        </EmptyState>
      </div>
    );
  }

  return <BlogArticle post={post} />;
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
            alt=""
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
