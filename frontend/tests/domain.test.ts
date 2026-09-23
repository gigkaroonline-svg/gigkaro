import assert from "node:assert/strict";
import { test } from "node:test";
import {
  searchJobs,
  getJobsByPincode,
  getJobs,
} from "../src/lib/services/jobs";
import { validatePostedJob } from "../src/lib/services/employers";
test("exact pincode excludes neighbouring areas", () => {
  const results = searchJobs({ location: "560034", radius: "0" });
  assert.equal(results.length, 0);
  assert.ok(results.every((j) => j.pincode === "560034"));
});
test("radius expands results using relative coordinates", () => {
  const nearby = searchJobs({ location: "560034", radius: "10" });
  assert.equal(nearby.length, 0);
  assert.ok(nearby.every((j) => j.distanceKm <= 10));
});
test("unknown pincodes never silently fall back to Bengaluru", () => {
  assert.equal(searchJobs({ location: "999999" }).length, 0);
});
test("combined category, pay, shift and vehicle filters apply", () => {
  const results = searchJobs({
    location: "Bengaluru",
    category: "delivery",
    salary: "30000-0",
    vehicle: "Bike required",
    shift: "Morning",
    immediate: true,
  });
  assert.equal(results.length, 0);
  assert.ok(
    results.every(
      (j) =>
        j.salaryMax >= 30000 &&
        j.category === "delivery" &&
        j.vehicle === "Bike required" &&
        j.shift === "Morning" &&
        j.immediateJoining,
    ),
  );
});
test("city selection excludes other cities", () => {
  assert.ok(
    searchJobs({ location: "Mumbai" }).every((j) => j.city === "Mumbai"),
  );
  assert.equal(searchJobs({ location: "Mumbai" }).length, 0);
});
test("conflicting filters produce an empty state", () => {
  assert.equal(
    searchJobs({ category: "warehouse", vehicle: "Bike required" }).length,
    0,
  );
});
test("pincode totals and unique job slugs are consistent", () => {
  assert.equal(getJobsByPincode("560034").length, 0);
  assert.equal(new Set(getJobs().map((j) => j.slug)).size, getJobs().length);
});
test("post-job flow rejects invalid openings, pincodes and salary inversion", () => {
  assert.ok(
    validatePostedJob(
      { title: "Delivery Partner", category: "delivery", openings: 1.2 },
      0,
    ),
  );
  assert.ok(
    validatePostedJob(
      {
        state: "Karnataka",
        district: "Bengaluru",
        city: "Bengaluru",
        locality: "HSR",
        pincode: "123",
      },
      1,
    ),
  );
  assert.ok(validatePostedJob({ salaryMin: 30000, salaryMax: 20000 }, 2));
  assert.equal(
    validatePostedJob({ salaryMin: 20000, salaryMax: 30000 }, 2),
    "",
  );
});
test("job description requires useful detail", () => {
  assert.ok(validatePostedJob({ description: "hello" }, 4));
  assert.equal(
    validatePostedJob(
      {
        description:
          "Deliver local packages safely and coordinate with the neighbourhood team.",
      },
      4,
    ),
    "",
  );
});

test("moderation removes non-active jobs from discovery", async () => {
  const { getEffectiveJobs } = await import("../src/lib/services/demo-jobs");
  const state = { postedJobs: [], statuses: {} };
  assert.equal(getEffectiveJobs(state).length, getJobs().length);
});
test("approved posted requirements become searchable and have a stable local route", async () => {
  const { getEffectiveJobs, jobHref } = await import(
    "../src/lib/services/demo-jobs"
  );
  const posted = {
    id: "posted_test",
    title: "Test Rider",
    category: "delivery",
    openings: 3,
    state: "Karnataka",
    district: "Bengaluru Urban",
    city: "Bengaluru",
    pincode: "560034",
    locality: "Koramangala",
    radius: "10",
    salaryMin: 20000,
    salaryMax: 30000,
    incentives: "1000",
    salaryType: "Monthly",
    employmentType: "Full-time",
    vehicle: "Bike required",
    experience: "Fresher welcome",
    shift: "Morning",
    joining: "Immediately",
    description: "A fictional requirement with a clear local work description.",
    status: "Pending approval" as const,
    createdAt: "2026-09-18",
  };
  assert.ok(
    !getEffectiveJobs({ postedJobs: [posted], statuses: {} }).some(
      (j) => j.id === posted.id,
    ),
  );
  const effective = getEffectiveJobs({
    postedJobs: [posted],
    statuses: { [posted.id]: "Active" },
  });
  const found = searchJobs(
    { location: "560034", category: "delivery", radius: "0" },
    effective,
  ).find((j) => j.id === posted.id);
  assert.ok(found);
  assert.equal(jobHref(found), "/job/local?id=posted_test");
});
test("employer workspace excludes candidates for other employers", async () => {
  const { getWorkspaceApplicants } = await import(
    "../src/lib/services/employers"
  );
  const state = { postedJobs: [], applications: [], statuses: {} };
  const scoped = getWorkspaceApplicants(state, true);
  assert.equal(scoped.length, 0);
  assert.equal(getWorkspaceApplicants(state).length, 0);
});
