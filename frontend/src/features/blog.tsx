import Link from "next/link";
import { Breadcrumb } from "@/components/primitives";
import { apiAssetUrl } from "@/lib/api";
import {
  formatBlogDate,
  type BlogPost,
} from "@/lib/services/api-blogs";

export function BlogIndex({ posts }: { posts: BlogPost[] }) {
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
          <div className="blog-grid">
            {posts.map((post) => (
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
        )}
      </div>
    </>
  );
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const paragraphs = post.body
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
        <div className="blog-prose">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <Link className="text-link" href="/blog">
          All stories
        </Link>
      </article>
    </>
  );
}
