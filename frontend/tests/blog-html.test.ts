import assert from "node:assert/strict";
import { test } from "node:test";
import { renderBlogBody } from "../src/lib/blog-html";
import { articlePageMetadata, metaDescription } from "../src/lib/metadata";

const title = "The Future of India's Gig Economy: 2026-2030";

test("citations sit inside the sentence and keep proper-noun casing", () => {
  const html = [
    '<p>The calendar is specific.<a href="https://www.labour.gov.in/sites/default/files/gazette.pdf"> as the gazette notification records</a>, every aggregator had forty-five days.</p>',
    '<p>The city page would.<a href="https://www.gigkaro.in/delivery-jobs/ghaziabad/"> ghaziabad\'s delivery page on the hiring network</a> holds the city\'s openings.</p>',
    '<p>The minister spoke in <a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2309283">september</a>.</p>',
    "<p>The account is exact.</p>",
    "<p>accounting is expected to be exact.</p>",
  ].join("");
  const out = renderBlogBody(html, title);
  assert.doesNotMatch(out, /\.[^<]*<a[^>]*>\s*[a-z]/);
  assert.match(out, /specific <a href="https:\/\/www\.labour\.gov\.in\/sites\/default\/files\/gazette\.pdf"[^>]*>as the gazette notification records<\/a>,/);
  assert.match(out, /would <a href="https:\/\/www\.gigkaro\.in\/delivery-jobs\/ghaziabad\/"[^>]*>Ghaziabad's delivery page on the hiring network<\/a> holds/);
  assert.match(out, />September</);
  assert.doesNotMatch(out, />september</);
  assert.doesNotMatch(out, />ghaziabad/);
  assert.match(out, /exact accounting is expected to be exact\./);
});

test("injected keyword tails and split sentences are cleaned", () => {
  const html = [
    "<p>India Gig Hiring Startups: Complete Market Map is a reading of that living edition.</p>",
    "<p>Blue collar hiring startups india hosts 113 of the platforms.</p>",
    "<p>The stack runs through payroll - gig payroll platforms india is the construction the layer is known by.</p>",
    "<p>Ev leasing for gig fleets india has put vehicles under riders.</p>",
    "<p>India had a printed map, and India's districts kept their own lists.</p>",
    "<p>software that carries a worker from KYC to payout trail;</p>",
    "<p>verification, which confirms the name behind every listing.</p>",
    '<p>a decade average of seventeen a year.<a href="https://tracxn.com/companies"> as the category tracker counts</a>, updated this month.</p>',
    '<p>The demand is dense.<a href="https://www.gigkaro.in/delivery-jobs/mumbai/"> the mumbai page on the hiring network</a> shows one deep market.</p>',
    '<p>Depth shows in single markets.<a href="https://www.gigkaro.in/delivery-jobs/bengaluru/"> the bengaluru demand page on the hiring network</a> is the deepest entry.</p>',
  ].join("");
  const out = renderBlogBody(html, "India Gig Hiring Startups: Complete Market Map");
  assert.match(out, /This is a reading of that living edition\./);
  assert.match(out, /startups host 113/);
  assert.match(out, /gig payroll platforms are the construction/);
  assert.match(out, /Ev leasing for gig fleets has put vehicles/);
  assert.match(out, /India had a printed map/);
  assert.match(out, /India's districts/);
  assert.doesNotMatch(out, /\bindia\b/);
  assert.match(out, /payout trail; verification, which confirms/);
  assert.doesNotMatch(out, /year\.<a/);
  assert.match(out, /year <a[^>]*>as the category tracker counts<\/a>, updated/);
  assert.match(out, />the Mumbai page on the hiring network</);
  assert.match(out, />the Bengaluru demand page on the hiring network</);
  assert.doesNotMatch(out, />the mumbai/);
  assert.doesNotMatch(out, />the bengaluru/);
});

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

test("article metadata is computed from the post fields", () => {
  const metadata = articlePageMetadata({
    title: "Story",
    excerpt: "A short excerpt that should be the description.",
    metaDescription: "This stored description is stale and must not win.".repeat(4),
    slug: "story",
    image: "https://storage.googleapis.com/gigkaro/blogs/cover.png",
    imageAlt: "Cover image for this story",
    imageWidth: 800,
    imageHeight: 400,
    publishedAt: "2026-10-22T19:54:43.796Z",
    updatedAt: "2026-10-22T19:54:43.797Z",
    authorUrl: "https://www.gigkaro.in/",
  });
  assert.equal(metadata.description, "A short excerpt that should be the description.");
  const openGraph = metadata.openGraph;
  assert.equal(openGraph && "type" in openGraph ? openGraph.type : "", "article");
  assert.equal(String(metadata.alternates?.canonical), "https://www.gigkaro.in/blog/story/");
  const images = metadata.openGraph?.images;
  const image = Array.isArray(images) ? images[0] : images;
  assert.equal(typeof image === "object" && image && "url" in image ? image.url : "", "https://storage.googleapis.com/gigkaro/blogs/cover.png");
  assert.equal(typeof image === "object" && image && "width" in image ? image.width : 0, 800);
  assert.equal(metadata.other?.["article:section"], "Blog");
});
