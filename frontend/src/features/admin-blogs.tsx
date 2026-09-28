"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, apiAssetUrl } from "@/lib/api";
import { formatBlogDate, type BlogPost } from "@/lib/services/api-blogs";

function CoverPreview({
  file,
  stored,
  onRemove,
}: {
  file: File | null;
  stored: string;
  onRemove: () => void;
}) {
  const [localUrl, setLocalUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setLocalUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const src = localUrl || (stored ? apiAssetUrl(stored) : "");
  if (!src) return null;
  return (
    <div className="blog-cover-preview">
      <img src={src} alt="" />
      <button type="button" onClick={onRemove} aria-label="Remove cover">
        ×
      </button>
    </div>
  );
}

const emptyForm = {
  title: "",
  excerpt: "",
  body: "",
  coverUrl: "",
  status: "draft" as "draft" | "published",
};

export function AdminBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverInputKey, setCoverInputKey] = useState(0);

  async function load() {
    const data = await api<{ posts: BlogPost[] }>("/admin/blogs");
    setPosts(data.posts);
  }

  useEffect(() => {
    load().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Could not load posts.");
    });
  }, []);

  function edit(post: BlogPost) {
    setEditing(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      coverUrl: post.coverUrl,
      status: post.status,
    });
    setCoverFile(null);
    setRemoveCover(false);
    setNotice("");
    setError("");
  }

  function clearEditor() {
    setEditing(null);
    setForm(emptyForm);
    setCoverFile(null);
    setRemoveCover(false);
    setCoverInputKey((key) => key + 1);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.set("title", form.title);
      body.set("excerpt", form.excerpt);
      body.set("body", form.body);
      body.set("status", form.status);
      if (coverFile) body.set("cover", coverFile);
      else if (removeCover) body.set("removeCover", "1");
      if (editing) {
        await api(`/admin/blogs/${editing}`, { method: "PATCH", body });
        setNotice("Story updated.");
      } else {
        await api("/admin/blogs", { method: "POST", body });
        setNotice(form.status === "published" ? "Story published." : "Draft saved.");
      }
      clearEditor();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the story.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(post: BlogPost, status: "draft" | "published") {
    setError("");
    try {
      await api(`/admin/blogs/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the story.");
    }
  }

  async function remove(post: BlogPost) {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    setError("");
    try {
      await api(`/admin/blogs/${post.id}`, { method: "DELETE" });
      if (editing === post.id) clearEditor();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the story.");
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>{editing ? "Edit story" : "New story"}</h2>
        <p>Write a short public post. Publish it when it is ready for the blog.</p>
        <form className="form-grid blog-editor" onSubmit={save}>
          <div className="form-field form-field-full">
            <label htmlFor="blog-title">Title</label>
            <input
              id="blog-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              minLength={3}
              maxLength={140}
            />
          </div>
          <div className="form-field form-field-full">
            <label htmlFor="blog-excerpt">Excerpt</label>
            <textarea
              id="blog-excerpt"
              value={form.excerpt}
              onChange={(event) =>
                setForm({ ...form, excerpt: event.target.value })
              }
              required
              minLength={20}
              maxLength={320}
            />
          </div>
          <div className="form-field form-field-full">
            <label htmlFor="blog-body">Story</label>
            <textarea
              id="blog-body"
              className="blog-body"
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              required
              minLength={40}
              placeholder="Separate paragraphs with a blank line."
            />
          </div>
          <div className="form-field">
            <label htmlFor="blog-cover">Cover image</label>
            <input
              id="blog-cover"
              key={coverInputKey}
              type="file"
              accept="image/*"
              onChange={(event) => {
                setCoverFile(event.target.files?.[0] || null);
                setRemoveCover(false);
              }}
            />
            <CoverPreview
              file={coverFile}
              stored={removeCover ? "" : form.coverUrl}
              onRemove={() => {
                setCoverFile(null);
                setRemoveCover(true);
                setCoverInputKey((key) => key + 1);
              }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="blog-status">Status</label>
            <select
              id="blog-status"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as "draft" | "published",
                })
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          {error ? (
            <p className="field-error form-field-full" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? <p className="notice form-field-full">{notice}</p> : null}
          <div className="row form-field-full">
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Save story"}
            </button>
            {editing ? (
              <button
                className="button button-outline"
                type="button"
                onClick={clearEditor}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>All stories</h2>
        {posts.length === 0 ? (
          <p className="muted">No stories yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table blog-stories">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      {post.coverUrl ? (
                        <img
                          className="blog-table-cover"
                          src={apiAssetUrl(post.coverUrl)}
                          alt=""
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className="blog-story-title">{post.title}</span>
                    </td>
                    <td>{post.status === "published" ? "Published" : "Draft"}</td>
                    <td>{formatBlogDate(post.publishedAt) || "—"}</td>
                    <td>
                      <div className="row">
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => edit(post)}
                        >
                          Edit
                        </button>
                        {post.status === "published" ? (
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => setStatus(post, "draft")}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => setStatus(post, "published")}
                          >
                            Publish
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => remove(post)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
