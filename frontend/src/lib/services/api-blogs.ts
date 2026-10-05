export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  authorName: string;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string | null;
};

function apiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
  ).replace(/\/$/, "");
}

export async function fetchPublishedPosts() {
  try {
    // Always hit the API so admin publishes appear without waiting on ISR cache.
    const res = await fetch(`${apiBase()}/blogs`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: BlogPost[] };
    return data.posts || [];
  } catch {
    return [];
  }
}

export async function fetchPublishedPost(slug: string) {
  try {
    const res = await fetch(
      `${apiBase()}/blogs/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    const data = (await res.json()) as { post?: BlogPost };
    return data.post ?? null;
  } catch {
    return undefined;
  }
}

export function formatBlogDate(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
