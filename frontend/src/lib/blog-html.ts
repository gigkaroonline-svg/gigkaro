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
        if (href.startsWith("/")) return `<a href="${href}">`;
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

function plainText(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function endsSentence(text: string) {
  return /[.!?…]["'”’)\]]*$/.test(text);
}

function isSectionHeading(text: string, title: string) {
  if (text.length < 2 || text.length > 80) return false;
  if (endsSentence(text)) return false;
  if (/^[a-z]/.test(text)) return false;
  if (text.toLowerCase() === title.trim().toLowerCase()) return false;
  return text.split(/\s+/).length <= 14;
}

type Block = { tag: "p" | "h2" | "h3" | "ul" | "ol" | "blockquote"; inner: string };

function topLevelBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const re = /<(p|h2|h3|ul|ol|blockquote)>([\s\S]*?)<\/\1>/gi;
  for (const match of html.matchAll(re)) {
    const tag = match[1].toLowerCase() as Block["tag"];
    blocks.push({
      tag,
      inner: match[2].replace(/\s*\n+\s*/g, " ").replace(/[ \t]{2,}/g, " ").trim(),
    });
  }
  return blocks;
}

function joinSplitParagraphs(blocks: Block[]) {
  const joined: Block[] = [];
  for (const block of blocks) {
    const previous = joined.at(-1);
    const text = plainText(block.inner);
    const previousText = previous ? plainText(previous.inner) : "";
    if (
      previous?.tag === "p" &&
      block.tag === "p" &&
      previousText &&
      !endsSentence(previousText) &&
      /^[a-z]/.test(text)
    ) {
      previous.inner = `${previous.inner} ${block.inner}`.replace(/\s+/g, " ").trim();
      continue;
    }
    joined.push({ ...block });
  }
  return joined;
}

/** Turn stored post HTML into heading tags and whole paragraphs. Does not rewrite sentences. */
export function renderBlogBody(value: string, title = "") {
  const source = looksLikeBlogHtml(value) ? value : plainTextToBlogHtml(value);
  const blocks = joinSplitParagraphs(topLevelBlocks(sanitizeBlogHtml(source)));
  const html = blocks
    .filter((block) => {
      if (block.tag !== "p") return true;
      return plainText(block.inner).toLowerCase() !== title.trim().toLowerCase();
    })
    .map((block) => {
      const text = plainText(block.inner);
      const tag =
        block.tag === "p" && isSectionHeading(text, title) ? "h2" : block.tag;
      return `<${tag}>${block.inner}</${tag}>`;
    })
    .join("");
  return html || "<p><br></p>";
}
