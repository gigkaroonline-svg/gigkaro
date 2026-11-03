import assert from "node:assert/strict";
import { test } from "node:test";
import {
  jobDescriptionHtml,
  jobPageMetadata,
  jobPostingSchema,
  metaDescription,
} from "../src/lib/metadata";
import type { Job } from "../src/types";

const job: Job = {
  id: "job1",
  slug: "delivery-partner-560034",
  title: "Delivery Partner",
  company: "Swiggy",
  companyId: "swiggy",
  companyLogo: "https://cdn.example.com/swiggy.png",
  initials: "SW",
  color: "blue",
  category: "delivery",
  city: "Bengaluru",
  locality: "Koramangala",
  pincode: "560034",
  lat: 12.9,
  lng: 77.6,
  distanceKm: 0,
  salaryMin: 25000,
  salaryMax: 40000,
  salaryType: "monthly",
  incentiveMax: 10000,
  openings: 500,
  immediateJoining: true,
  vehicle: "Bike required",
  verified: true,
  employmentType: "Full-time",
  shift: "Flexible",
  postedAt: "2026-11-03",
  description:
    "A delivery partner safely and efficiently transports food, groceries, or packages from a hub, store, or restaurant directly to the customer.",
  requirements: ["Own a bike", "Valid licence"],
  status: "Active",
};

test("job description HTML includes overview, duties and requirements", () => {
  const html = jobDescriptionHtml(job);
  assert.match(html, /Swiggy is hiring Delivery Partner for the Koramangala area in Bengaluru/);
  assert.match(html, /A delivery partner safely/);
  assert.match(html, /<strong>Shift:<\/strong> Flexible/);
  assert.match(html, /<strong>Responsibilities<\/strong>/);
  assert.match(html, /Pick up orders from nearby stores or hubs around Koramangala/);
  assert.match(html, /<strong>How to apply<\/strong>/);
  assert.match(html, /<li>Own a bike<\/li>/);
  assert.match(html, /Work location: Koramangala, Bengaluru/);
  assert.equal(html.includes("<script"), false);
});

test("job posting schema has Google Jobs required fields and HTML description", () => {
  const schema = jobPostingSchema(job);
  assert.equal(schema["@type"], "JobPosting");
  assert.equal(schema.title, "Delivery Partner");
  assert.match(String(schema.description), /<p>/);
  assert.equal(schema.datePosted, "2026-11-03");
  assert.equal(schema.hiringOrganization.name, "Swiggy");
  assert.equal(schema.hiringOrganization.logo, "https://cdn.example.com/swiggy.png");
  assert.equal(schema.jobLocation.address.addressCountry, "IN");
  assert.equal(schema.jobLocation.geo?.latitude, 12.9);
  assert.equal(schema.jobLocation.geo?.longitude, 77.6);
  assert.equal(schema.employmentType, "FULL_TIME");
  assert.equal(schema.directApply, true);
  assert.equal(schema.jobImmediateStart, true);
  assert.equal(schema.identifier.name, "Swiggy");
  assert.equal("validThrough" in schema, false);
});

test("job page metadata uses a trimmed description and company image", () => {
  const meta = jobPageMetadata(job);
  assert.equal(meta.title, "Delivery Partner in Koramangala");
  assert.ok(typeof meta.description === "string");
  assert.ok((meta.description as string).length <= 155);
  assert.equal(meta.description, metaDescription(meta.description as string));
  const images = meta.openGraph && "images" in meta.openGraph ? meta.openGraph.images : null;
  assert.ok(Array.isArray(images));
  assert.equal((images as { url: string }[])[0]?.url, "https://cdn.example.com/swiggy.png");
});
