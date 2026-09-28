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
    const res = await fetch(`${apiBase()}/blogs`, {
      next: { revalidate: 60 },
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
      { next: { revalidate: 60 } },
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
