const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
]);

export function plainTextToBlogHtml(value: string) {
  const parts = value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return "<p><br></p>";
  return parts
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function looksLikeBlogHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function toEditorHtml(value: string) {
  if (!value.trim()) return "<p><br></p>";
  return looksLikeBlogHtml(value) ? sanitizeBlogHtml(value) : plainTextToBlogHtml(value);
}

export function blogHtmlTextLength(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim().length;
}

export function sanitizeBlogHtml(html: string) {
  const cleaned = html
    .replace(
      /<\s*(script|style|iframe|object|embed|form|input|textarea|button|link|meta|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      "",
    )
    .replace(
      /<\s*(script|style|iframe|object|embed|form|input|textarea|button|link|meta|svg|math)[^>]*\/?\s*>/gi,
      "",
    )
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "");

  const sanitized = cleaned.replace(
    /<\/?([a-z0-9]+)([^>]*)>/gi,
    (match, rawTag: string, attrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (tag === "br") return "<br>";
      const closing = match.startsWith("</");
      if (closing) return `</${tag}>`;
      if (tag === "a") {
        const hrefMatch = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
          attrs,
        );
        const href = (hrefMatch?.[2] || hrefMatch?.[3] || hrefMatch?.[4] || "")
          .trim()
          .replace(/"/g, "");
        if (!/^https?:\/\//i.test(href) && !href.startsWith("/")) return "";
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
      }
      return `<${tag}>`;
    },
  );

  return sanitized.trim() || "<p><br></p>";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');
}
