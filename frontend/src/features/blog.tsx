"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumb, EmptyState } from "@/components/primitives";
import { API_URL, apiAssetUrl } from "@/lib/api";
import { looksLikeBlogHtml, renderBlogBody } from "@/lib/blog-html";
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
                      loading="lazy"
                      decoding="async"
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

export function BlogArticle({
  post,
  related = [],
}: {
  post: BlogPost;
  related?: BlogPost[];
}) {
  const htmlBody = renderBlogBody(post.body || "", post.title);
  const published = post.publishedAt || "";
  const updated = post.updatedAt || published;
  const authorHref = post.authorUrl || (/^(gigkaro|gigkaro admin)$/i.test(post.authorName || "") ? "/about/" : "");
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
        </div>
      </div>
      <article className="container page-content blog-article">
        <p className="blog-meta">
          {published ? (
            <>
              Published <time dateTime={published}>{formatBlogDate(published)}</time>
            </>
          ) : null}
          {updated ? (
            <>
              {published ? " · " : null}
              Updated <time dateTime={updated}>{formatBlogDate(updated)}</time>
            </>
          ) : null}
          {post.authorName ? (
            <>
              {" · "}
              {authorHref ? (
                <Link href={authorHref}>{post.authorName}</Link>
              ) : (
                post.authorName
              )}
            </>
          ) : null}
        </p>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        {post.coverUrl ? (
          <img
            src={apiAssetUrl(post.coverUrl)}
            alt={post.coverAlt || "Cover image for this story"}
            className="blog-cover"
            fetchPriority="high"
            decoding="async"
          />
        ) : null}
        {looksLikeBlogHtml(htmlBody) ? (
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: htmlBody }}
          />
        ) : null}
        {related.length ? (
          <section className="related-stories" aria-label="Related stories">
            <h2>Related stories</h2>
            <ul>
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/blog/${item.slug}/`}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Link className="text-link" href="/blog">
          All stories
        </Link>
      </article>
    </>
  );
}
