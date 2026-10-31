export const BLOG_PAGE_SIZE = 12;

export function blogListHref(page: number) {
  return page <= 1 ? "/blog/" : `/blog/page/${page}/`;
}

export function relatedStories<T extends { slug: string; title: string; publishedAt?: string | null }>(
  posts: T[],
  currentSlug: string,
  limit = 3,
) {
  const current = posts.find((post) => post.slug === currentSlug);
  const words = new Set(
    (current?.title || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );
  return posts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => ({
      post,
      score: post.title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => words.has(word)).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.post.publishedAt || "").localeCompare(a.post.publishedAt || ""),
    )
    .slice(0, limit)
    .map((item) => item.post);
}
