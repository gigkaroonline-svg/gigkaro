"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { JobCardSkeleton, JobList } from "@/components/job-card";
import {
  OPENINGS_PAGE_SIZE,
  OpeningsPager,
} from "@/components/openings-pager";
import { EmptyState, Breadcrumb, SectionHeading } from "@/components/primitives";
import { api } from "@/lib/api";
import {
  pageExpandedJobs,
  phase1PlaceSlots,
  placesForCity,
} from "@/lib/city-openings";
import { uiText } from "@/lib/i18n";
import { jobsSearchHref, parseJobsPath } from "@/lib/jobs-search-url";
import { fetchJobs } from "@/lib/services/api-jobs";
import { getCategories } from "@/lib/services/categories";
import {
  getCityBySlug,
  getLocationByPincode,
  getPhase1Cities,
  slugifyPlace,
} from "@/lib/services/locations";
import type { Job, SearchFilters } from "@/types";

type LocationHit = {
  pincode: string;
  locality: string;
  city: string;
};

function placeQuery(hit: LocationHit, typed: string) {
  const q = typed.trim().toLowerCase();
  if (/^\d/.test(q)) return hit.pincode;
  const city = hit.city.toLowerCase();
  const locality = hit.locality.toLowerCase();
  if (locality === q || locality.startsWith(q)) return hit.locality;
  if (city === q || city.startsWith(q) || city.includes(q)) return hit.city;
  return hit.locality || hit.pincode;
}

export function SearchResults({
  initialLocation = "",
  initialCategory = "",
  initialCompany = "",
  initialJobs,
  heading,
}: {
  initialLocation?: string;
  initialCategory?: string;
  initialCompany?: string;
  /** SSR-seeded openings so crawlers never see a broken API state. */
  initialJobs?: Job[];
  heading?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const suggestId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const typedLocation = useRef(false);
  const pathParts = parseJobsPath(path);
  const seedLocation = initialLocation || pathParts.location;
  const seedCompany = initialCompany || pathParts.company;
  const [text, setText] = useState(params.get("location") || seedLocation);
  const [hits, setHits] = useState<LocationHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>(initialJobs ?? []);
  const [loading, setLoading] = useState(!initialJobs);
  const [error, setError] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filters: SearchFilters = {
    location: params.get("location") ?? seedLocation,
    category: params.get("category") ?? initialCategory,
    company: params.get("company") || seedCompany || "",
    radius:
      params.get("radius") ||
      (/^\d{6}$/.test(
        ((params.get("location") ?? seedLocation) || "").trim(),
      )
        ? "10"
        : ""),
  };

  const categoryMeta = useMemo(
    () =>
      getCategories().find(
        (c) =>
          c.id === filters.category ||
          c.aliases?.includes(String(filters.category || "")),
      ),
    [filters.category],
  );

  const companyLabel = useMemo(() => {
    const key = (filters.company || "").trim();
    if (!key) return "";
    const fromJobs = jobs.find(
      (job) =>
        job.companyId?.toLowerCase() === key.toLowerCase() ||
        job.company?.toLowerCase() === key.toLowerCase(),
    );
    return fromJobs?.company || key.replace(/-/g, " ");
  }, [filters.company, jobs]);

  useEffect(() => {
    const location = (filters.location || "").trim();
    if (!/^\d{6}$/.test(location)) {
      setPlaceName("");
      return;
    }
    const known = getLocationByPincode(location);
    const knownName = known
      ? [known.locality, known.city].filter(Boolean).join(", ")
      : "";
    if (knownName) {
      setPlaceName(knownName);
      if (!typedLocation.current) setText(knownName);
    }
    let cancelled = false;
    api<{ location: { locality: string; city: string; pincode?: string } }>(
      `/locations/${location}`,
      { auth: false },
    )
      .then((data) => {
        if (cancelled) return;
        const name = [data.location.locality, data.location.city]
          .filter(Boolean)
          .join(", ");
        if (!name) return;
        setPlaceName(name);
        if (!typedLocation.current) setText(name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filters.location]);

  const nearLabel = placeName || filters.location;
  const isPinSearch = /^\d{6}$/.test((filters.location || "").trim());

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    // Resolved pincode labels should not open the suggest dropdown.
    if (!typedLocation.current && placeName && q === placeName) {
      setHits([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearchingPlaces(true);
      api<{ locations: LocationHit[] }>(
        `/locations/search?q=${encodeURIComponent(q)}&limit=8`,
        { auth: false },
      )
        .then((data) => {
          if (cancelled) return;
          const next = data.locations || [];
          setHits(next);
          setOpen(typedLocation.current && next.length > 0);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setSearchingPlaces(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, placeName]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!fieldRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    typedLocation.current = false;
    setText(params.get("location") || seedLocation);
    setOpen(false);
    setPage(1);
  }, [
    params.get("location"),
    params.get("category"),
    params.get("company"),
    seedLocation,
    initialCategory,
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query: SearchFilters & { sort?: string } = {
      location: filters.location,
      category: filters.category,
      company: filters.company,
      sort: "recommended",
    };
    if (isPinSearch && filters.radius) query.radius = filters.radius;
    fetchJobs(query)
      .then((list) => {
        if (!cancelled) setJobs(list);
      })
      .catch((err) => {
        // Never surface API/diagnostics on public crawlable pages.
        // Keep SSR seed or the last good list instead of an error state.
        console.error("[job-search] failed to load jobs", { query, err });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    filters.location,
    filters.category,
    filters.company,
    filters.radius,
    isPinSearch,
  ]);

  function change(key: string, value: string | boolean) {
    const next = {
      location: filters.location,
      category: filters.category,
      company: filters.company,
      radius: filters.radius,
      city: params.get("city") || "",
      citySlug: params.get("citySlug") || "",
    };
    if (seedLocation && !next.location) next.location = seedLocation;
    if (initialCategory && !next.category) next.category = initialCategory;
    if (seedCompany && !next.company) next.company = seedCompany;
    if (value) next[key as keyof typeof next] = String(value);
    else next[key as keyof typeof next] = "";
    if (key === "location") {
      next.city = "";
      next.citySlug = "";
    }
    if (key !== "radius" && !/^\d{6}$/.test((next.location || "").trim())) {
      next.radius = "";
    }
    router.replace(jobsSearchHref(next), { scroll: false });
  }

  // Prefer path URLs (/jobs/{company}/ or /jobs/{location}/{company}/) over query.
  useEffect(() => {
    if (!mounted) return;
    const location = (filters.location || "").trim();
    const company = (filters.company || "").trim();
    if (!company || filters.category) return;
    if (!/^\/jobs\/?$/.test(path)) return;
    const target = jobsSearchHref({
      location,
      company,
      radius: filters.radius,
    });
    if (target !== path && !target.startsWith(`${path}?`)) {
      router.replace(target, { scroll: false });
    }
  }, [
    mounted,
    path,
    filters.location,
    filters.company,
    filters.category,
    filters.radius,
    router,
  ]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const typed = text.trim();
    if (/^\d+$/.test(typed) && typed.length !== 6) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }
    setError("");
    setOpen(false);
    // Keep the pincode query when the field is only showing the resolved label.
    const next =
      isPinSearch && placeName && typed === placeName
        ? (filters.location || "").trim()
        : typed;
    change("location", next);
  }

  function pick(hit: LocationHit) {
    const label = [hit.locality, hit.city].filter(Boolean).join(", ");
    const searchValue = /^\d/.test(text.trim())
      ? hit.pincode
      : placeQuery(hit, text);
    setText(label || searchValue);
    setPlaceName(label);
    typedLocation.current = false;
    setError("");
    setOpen(false);
    change("location", searchValue);
  }

  const locationKey = (filters.location || "").trim();
  const matchedCity = useMemo(() => {
    if (!locationKey || isPinSearch) return undefined;
    const bySlug = getCityBySlug(slugifyPlace(locationKey));
    if (bySlug) return bySlug;
    return getPhase1Cities().find(
      (city) => city.name.toLowerCase() === locationKey.toLowerCase(),
    );
  }, [locationKey, isPinSearch]);

  // Expand nationwide roles across phase1 localities (or one city) so cards
  // are not stuck on the seed Koramangala pin. Defer the full 4k-slot list
  // until client mount so /jobs SSR stays light on Vercel.
  const expandPlaces = useMemo(() => {
    if (isPinSearch) return null;
    if (matchedCity) return placesForCity(matchedCity);
    if (!locationKey) return mounted ? phase1PlaceSlots() : null;
    return null;
  }, [isPinSearch, matchedCity, locationKey, mounted]);

  const expanded = useMemo(() => {
    if (expandPlaces) {
      return pageExpandedJobs(jobs, expandPlaces, page, OPENINGS_PAGE_SIZE);
    }
    const total = jobs.length;
    const totalPages = Math.max(1, Math.ceil(total / OPENINGS_PAGE_SIZE));
    const safe = Math.min(page, totalPages);
    const start = (safe - 1) * OPENINGS_PAGE_SIZE;
    return {
      rows: jobs.slice(start, start + OPENINGS_PAGE_SIZE),
      total,
    };
  }, [expandPlaces, jobs, page]);

  const pages = Math.max(1, Math.ceil(expanded.total / OPENINGS_PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = expanded.rows;

  const openingsTitle = heading
    ? heading
    : companyLabel && !nearLabel && !categoryMeta
      ? `Open roles at ${companyLabel}`
      : companyLabel && nearLabel
        ? `${companyLabel} openings near ${nearLabel}`
        : categoryMeta && !nearLabel
          ? `Open roles in ${categoryMeta.title}`
          : nearLabel
            ? `Openings near ${nearLabel}`
            : "Open roles near you";

  const crumb = (() => {
    const fromCity = params.get("city");
    const fromCitySlug = params.get("citySlug");
    const locationLabel = (
      params.get("location") ||
      seedLocation ||
      ""
    ).trim();
    if (fromCity && fromCitySlug) {
      return [
        { label: "Locations", href: "/locations" },
        {
          label: fromCity,
          href: `/locations/${encodeURIComponent(fromCitySlug)}/`,
        },
        ...(locationLabel ? [{ label: locationLabel }] : []),
      ];
    }
    if (companyLabel) {
      return [
        { label: "Find jobs", href: "/jobs" },
        { label: companyLabel },
      ];
    }
    if (categoryMeta) {
      return [
        { label: "Categories", href: "/categories" },
        { label: categoryMeta.title },
      ];
    }
    return [{ label: "Find jobs" }];
  })();

  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumb items={crumb} />
          <div className="eyebrow">{uiText("goodWorkCloserToHome2")}</div>
          <h1>{openingsTitle}</h1>
          <p>
            {categoryMeta || nearLabel || companyLabel
              ? [
                  categoryMeta
                    ? `Browse ${categoryMeta.title.toLowerCase()} openings`
                    : companyLabel
                      ? `Browse openings at ${companyLabel}`
                      : "Browse gig openings",
                  nearLabel ? ` near ${nearLabel}` : "",
                  ". Know your earnings before you apply.",
                ].join("")
              : uiText("findYourFitKnowYourEarningsMakeYourNextMove")}
          </p>
          <form className="results-search" onSubmit={submit}>
            <div ref={fieldRef}>
              <MapPin size={19} />
              <input
                aria-label={uiText("searchPincodeCityOrArea")}
                placeholder={uiText("pincodeCityOrArea")}
                value={text}
                autoComplete="off"
                role="combobox"
                aria-expanded={open}
                aria-controls={suggestId}
                onChange={(e) => {
                  typedLocation.current = true;
                  setText(e.target.value);
                  setError("");
                }}
                onFocus={() => {
                  if (hits.length && typedLocation.current) setOpen(true);
                }}
              />
              {open && (hits.length > 0 || searchingPlaces) && (
                <ul id={suggestId} className="location-suggest" role="listbox">
                  {searchingPlaces && !hits.length && (
                    <li className="location-suggest-empty">Searching…</li>
                  )}
                  {hits.map((hit) => (
                    <li key={`${hit.pincode}-${hit.locality}`}>
                      <button
                        type="button"
                        role="option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pick(hit)}
                      >
                        <strong>
                          {/^\d/.test(text.trim())
                            ? hit.pincode
                            : placeQuery(hit, text)}
                        </strong>
                        <span>
                          {hit.locality}, {hit.city}
                          {hit.pincode ? ` · ${hit.pincode}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <select
              aria-label={uiText("searchCategory")}
              value={filters.category}
              onChange={(e) => change("category", e.target.value)}
            >
              <option value="">{uiText("allCategories")}</option>
              {getCategories().map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button className="button button-primary">
              <Search size={17} />
              {uiText("findJobs")}
            </button>
          </form>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <section
        id="job-openings"
        className="container section city-page-body openings-results"
      >
        <SectionHeading
          title={
            loading
              ? "Openings"
              : `${expanded.total.toLocaleString("en-IN")} ${
                  expanded.total === 1 ? "opening" : "openings"
                }${
                  companyLabel
                    ? ` at ${companyLabel}`
                    : nearLabel
                      ? ` near ${nearLabel}`
                      : categoryMeta
                        ? ` in ${categoryMeta.title}`
                        : expandPlaces
                          ? " across major cities"
                          : ""
                }${
                  companyLabel && nearLabel ? ` near ${nearLabel}` : ""
                }`
          }
        />

        {isPinSearch && (
          <div className="openings-radius-chips" role="group" aria-label="Distance">
            {[
              ["0", "Exact pincode"],
              ["5", "Within 5 km"],
              ["10", "Within 10 km"],
              ["25", "Within 25 km"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`quick-chip ${filters.radius === value ? "selected" : ""}`}
                onClick={() => change("radius", value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="job-grid" role="status" aria-busy="true">
            <span className="sr-only">Loading jobs…</span>
            {Array.from({ length: 6 }, (_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length ? (
          <div className="city-openings">
            <JobList jobs={visible} />
            <OpeningsPager
              page={safePage}
              totalPages={pages}
              onChange={setPage}
              scrollToId="job-openings"
            />
          </div>
        ) : (
          <EmptyState
            title={
              categoryMeta && nearLabel
                ? `No ${categoryMeta.title.toLowerCase()} openings near ${nearLabel} right now`
                : companyLabel && nearLabel
                  ? `No open roles at ${companyLabel} near ${nearLabel} right now`
                  : companyLabel
                    ? `No open roles at ${companyLabel} right now`
                    : categoryMeta
                      ? `No ${categoryMeta.title.toLowerCase()} openings right now`
                      : nearLabel
                        ? `No open roles near ${nearLabel} right now`
                        : "No matching jobs"
            }
            description={
              categoryMeta || nearLabel || companyLabel
                ? `New ${
                    categoryMeta?.title.toLowerCase() || "gig"
                  } roles are added often${
                    nearLabel ? ` around ${nearLabel}` : ""
                  }. Try another area, widen a pincode search, or browse all categories.`
                : "Try another area, category, or widen the distance for a pincode search."
            }
          >
            {isPinSearch ? (
              <button
                className="button button-primary"
                type="button"
                onClick={() =>
                  change(
                    "radius",
                    Number(filters.radius || 10) < 25 ? "25" : "10",
                  )
                }
              >
                Search within {Number(filters.radius || 10) < 25 ? "25" : "10"} km
              </button>
            ) : (
              <button
                className="button button-primary"
                type="button"
                onClick={() => change("category", "")}
              >
                Browse all categories
              </button>
            )}
          </EmptyState>
        )}
      </section>
    </>
  );
}
