import assert from "node:assert/strict";
import { test } from "node:test";
import { renderBlogBody } from "../src/lib/blog-html";
import { metaDescription } from "../src/lib/metadata";

const title = "The Future of India's Gig Economy: 2026-2030";

test("section titles become h2 and split paragraphs are joined", () => {
  const html = [
    `<p>${title}</p>`,
    "<p>The dates already in print</p>",
    "<p>The newest entries end with the next five years of</p>",
    "<p>implementation will actually be won or lost.</p>",
    "<p>A full sentence stays here.</p>",
    '<p>See <a href="/delivery-jobs/ghaziabad/">Ghaziabad</a> in September.</p>',
  ].join("");
  const out = renderBlogBody(html, title);
  assert.match(out, /<h2>The dates already in print<\/h2>/);
  assert.doesNotMatch(out, new RegExp(`<p>${title}</p>`));
  assert.match(
    out,
    /next five years of implementation will actually be won or lost\./,
  );
  assert.match(out, />Ghaziabad</);
  assert.doesNotMatch(out, />ghaziabad</);

  const paragraphs = [...out.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) =>
    match[1].replace(/<[^>]+>/g, "").trim(),
  );
  for (const paragraph of paragraphs) {
    assert.match(paragraph, /[.!?…]["'”’)\]]*$/);
  }
  for (let i = 1; i < paragraphs.length; i += 1) {
    const previous = paragraphs[i - 1];
    if (!/[.!?…]["'”’)\]]*$/.test(previous)) {
      assert.doesNotMatch(paragraphs[i], /^[a-z]/);
    }
  }
});

test("meta descriptions stop at a word and do not add an ellipsis", () => {
  const value =
    "A 2026-2030 forecast built from what is already in motion: the dates printed in the new social security rules, the skilling programmes already funded, the eligibility clocks now running, and the question of what comes next for workers.";
  const description = metaDescription(value);
  assert.ok(description.length <= 155);
  assert.equal(description.includes("…"), false);
  assert.equal(description.endsWith(" "), false);
});
