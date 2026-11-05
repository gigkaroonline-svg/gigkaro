"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  Breadcrumb,
  EmptyState,
  SectionHeading,
} from "@/components/primitives";
import { LocalityOpeningsList } from "@/features/locality-openings-list";
import { jobsForLocalityPlace } from "@/lib/city-openings";
import { fetchJobs } from "@/lib/services/api-jobs";
import {
  cityHubPath,
  getLocalityInCity,
  localitySeoBlurb,
  slugifyPlace,
} from "@/lib/services/locations";
import type { Job } from "@/types";

function parseLocalityPath(pathname: string) {
  const segs = pathname.split("/").filter(Boolean);
  if (segs[0] !== "locations" || segs.length < 3 || segs[1] === "view") {
    return { citySlug: "", localitySlug: "" };
  }
  return {
    citySlug: slugifyPlace(decodeURIComponent(segs[1])),
    localitySlug: slugifyPlace(decodeURIComponent(segs[2])),
  };
}

export function LocalityViewPage() {
  const [citySlug, setCitySlug] = useState("");
  const [localitySlug, setLocalitySlug] = useState("");
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    const parsed = parseLocalityPath(window.location.pathname);
    setCitySlug(parsed.citySlug);
    setLocalitySlug(parsed.localitySlug);
  }, []);

  const hit = useMemo(
    () =>
      citySlug && localitySlug
        ? getLocalityInCity(citySlug, localitySlug)
        : undefined,
    [citySlug, localitySlug],
  );

  useEffect(() => {
    if (!hit) {
      setJobs([]);
      return;
    }
    let cancelled = false;
    fetchJobs({ location: hit.city.name })
      .then((list) => {
        if (!cancelled) setJobs(list);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [hit]);

  if (!citySlug || !localitySlug) {
    return (
      <div className="container page-content" aria-label="Loading locality" role="status">
        <div className="skeleton short" />
        <div className="skeleton tall" />
      </div>
    );
  }

  if (!hit) {
    return (
      <div className="container page-content">
        <EmptyState
          title="This opportunity has moved on."
          description="The link may have expired, or this location isn’t available yet. There’s more work to explore."
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

  const { city, locality } = hit;
  const rows =
    jobs === null ? [] : jobsForLocalityPlace(jobs, city, locality);
  const openingLabel =
    jobs === null
      ? "LOADING"
      : `${rows.length.toLocaleString("en-IN")} ${
          rows.length === 1 ? "opening" : "openings"
        }`.toUpperCase();

  return (
    <>
      <section className="page-intro">
        <div className="container">
          <Breadcrumb
            items={[
              { label: "Locations", href: "/locations" },
              { label: city.name, href: cityHubPath(city.slug) },
              { label: locality },
            ]}
          />
          <div className="eyebrow">
            {city.name.toUpperCase()} · {openingLabel}
          </div>
          <h1>Gig jobs in {locality}</h1>
          <p>{localitySeoBlurb(city, locality)}</p>
          <div className="city-page-intro-actions">
            <a className="button button-primary" href="#locality-openings">
              See jobs in {locality}
              <ArrowRight size={16} aria-hidden />
            </a>
            <Link className="button button-outline" href={cityHubPath(city.slug)}>
              Back to {city.name}
            </Link>
          </div>
        </div>
      </section>

      <section
        id="locality-openings"
        className="container section city-page-body"
      >
        <SectionHeading title={`Openings near ${locality}`} />
        {jobs === null ? (
          <div aria-label="Loading jobs" role="status">
            <div className="skeleton short" />
            <div className="job-grid">
              <div className="job-card job-card-skeleton" />
              <div className="job-card job-card-skeleton" />
            </div>
          </div>
        ) : rows.length ? (
          <LocalityOpeningsList jobs={jobs} city={city} locality={locality} />
        ) : (
          <EmptyState
            title={`No open roles in ${locality} yet`}
            description={`Browse other neighbourhoods in ${city.name} or widen your search.`}
          >
            <Link className="button button-primary" href={cityHubPath(city.slug)}>
              Explore {city.name}
            </Link>
          </EmptyState>
        )}
      </section>
    </>
  );
}
