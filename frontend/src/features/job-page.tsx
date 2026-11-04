"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JobDetail } from "@/features/job-detail";
import { EmptyState } from "@/components/primitives";
import { jobPlaceDisplayName } from "@/lib/job-url";
import { fetchJobBySlug } from "@/lib/services/api-jobs";
import { getCityBySlug, slugifyPlace } from "@/lib/services/locations";
import type { Job } from "@/types";

function looksLikeJobSlug(segment: string) {
  const key = slugifyPlace(segment);
  if (!key) return false;
  if (getCityBySlug(key)) return false;
  return key.includes("-");
}

/** Parse /job/{slug}/, place-first, or legacy slug-first paths. */
function parseJobPath(pathname: string) {
  const segs = pathname.split("/").filter(Boolean);
  if (segs[0] !== "job" || segs.length < 2) {
    return { slug: "", city: "", locality: "" };
  }
  const parts = segs.slice(1);
  if (parts.length === 1) {
    return { slug: parts[0], city: "", locality: "" };
  }
  if (!looksLikeJobSlug(parts[0])) {
    if (parts.length === 2) {
      return {
        slug: parts[1],
        city: jobPlaceDisplayName(parts[0], "city"),
        locality: "",
      };
    }
    return {
      slug: parts[parts.length - 1],
      city: jobPlaceDisplayName(parts[0], "city"),
      locality: jobPlaceDisplayName(parts[1], "locality", parts[0]),
    };
  }
  // Legacy /job/{slug}/{city}/[{locality}/]
  return {
    slug: parts[0],
    city: parts[1] ? jobPlaceDisplayName(parts[1], "city") : "",
    locality: parts[2]
      ? jobPlaceDisplayName(parts[2], "locality", parts[1])
      : "",
  };
}

export function JobPage() {
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [placeCity, setPlaceCity] = useState("");
  const [placeLocality, setPlaceLocality] = useState("");

  useEffect(() => {
    const parsed = parseJobPath(window.location.pathname);
    const slug = parsed.slug;
    if (slug && /^\d{6}$/.test(slug)) {
      window.location.replace(`/jobs/${slug}/`);
      return;
    }
    if (!slug || slug === "view") {
      setJob(null);
      return;
    }
    let cancelled = false;
    const query = new URLSearchParams(window.location.search);
    const city =
      parsed.city ||
      query.get("city")?.trim() ||
      "";
    const locality =
      parsed.locality ||
      query.get("locality")?.trim() ||
      "";
    setPlaceCity(city);
    setPlaceLocality(locality);
    fetchJobBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setJob(
          (city || locality) && data.showEverywhere
            ? {
                ...data,
                city: city || data.city,
                locality: locality || "",
                pincode: "",
              }
            : data,
        );
      })
      .catch(() => {
        if (!cancelled) setJob(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!job) return;
    const place = placeLocality || placeCity || job.locality || job.city;
    document.title = `${job.title} in ${place} — ₹${job.salaryMin / 1000}k–₹${job.salaryMax / 1000}k | GigKaro`;
  }, [job, placeCity, placeLocality]);

  if (job === undefined) {
    return (
      <div className="container page-content" aria-label="Loading job" role="status">
        <div className="skeleton short" />
        <div className="skeleton tall" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container page-content">
        <EmptyState
          title="This opportunity has moved on."
          description="The link may have expired, or this job is no longer available."
        >
          <Link className="button button-primary" href="/jobs">
            Find Nearby Jobs
          </Link>
          <Link className="button button-outline" href="/locations">
            Explore Locations
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <JobDetail
      job={job}
      placeCity={placeCity}
      placeLocality={placeLocality}
    />
  );
}
