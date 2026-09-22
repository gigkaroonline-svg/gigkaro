"use client";
import { uiText } from "@/lib/i18n";

import { useEffect, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  Bell,
  ArrowRight,
} from "lucide-react";
import { getLocations } from "@/lib/services/locations";
import { getCategories } from "@/lib/services/categories";
import { JobCard } from "@/components/job-card";
import { EmptyState, Breadcrumb } from "@/components/primitives";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetHeader,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { useDemoStore } from "@/hooks/use-demo-store";
import { fetchJobs } from "@/lib/services/api-jobs";
import type { Job, SearchFilters } from "@/types";
const filterGroups = [
  {
    key: "radius",
    label: "Distance",
    options: [
      ["0", "Exact pincode"],
      ["5", "Within 5 km"],
      ["10", "Within 10 km"],
      ["25", "Within 25 km"],
    ],
  },
  {
    key: "salary",
    label: "Monthly earnings",
    options: [
      ["0-15000", "Below ₹15,000"],
      ["15000-20000", "₹15,000–₹20,000"],
      ["20000-25000", "₹20,000–₹25,000"],
      ["25000-30000", "₹25,000–₹30,000"],
      ["30000-0", "₹30,000+"],
    ],
  },
  {
    key: "type",
    label: "Job type",
    options: ["Full-time", "Part-time", "Flexible"].map((s) => [s, s]),
  },
  {
    key: "shift",
    label: "Shift",
    options: ["Morning", "Evening", "Night", "Flexible"].map((s) => [s, s]),
  },
  {
    key: "vehicle",
    label: "Vehicle",
    options: ["Bike required", "EV accepted", "No vehicle required"].map(
      (s) => [s, s],
    ),
  },
];
export function JobFilters({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (key: string, value: string | boolean) => void;
}) {
  const filterId = useId();
  return (
    <div className="filter-fields">
      <div className="filter-group">
        <h3>{uiText("category")}</h3>
        <select
          className="control"
          aria-label={uiText("filterByCategory")}
          value={filters.category || ""}
          onChange={(e) => onChange("category", e.target.value)}
        >
          <option value="">{uiText("allCategories")}</option>
          {getCategories().map((c) => (
            <option value={c.id} key={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {filterGroups.map((g) => (
        <fieldset className="filter-group" key={g.key}>
          <legend>{g.label}</legend>
          {g.options.map(([value, label]) => (
            <label className="check-label" key={value}>
              <input
                type="radio"
                name={`${filterId}-${g.key}`}
                checked={filters[g.key as keyof SearchFilters] === value}
                onChange={() => onChange(g.key, value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="filter-group">
        <label className="check-label">
          <input
            type="checkbox"
            checked={!!filters.immediate}
            onChange={(e) => onChange("immediate", e.target.checked)}
          />
          {uiText("immediateJoining")}
        </label>
      </div>
      <p className="filter-note">
        {uiText(
          "earningsFiltersIncludeJobsWhoseAdvertisedRangeOverlapsYourSelection",
        )}
      </p>
    </div>
  );
}
export function SearchResults({
  initialLocation = "",
  initialCategory = "",
  heading,
}: {
  initialLocation?: string;
  initialCategory?: string;
  heading?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const { toast, update } = useDemoStore();
  const [text, setText] = useState(params.get("location") || initialLocation);
  const [sort, setSort] = useState("recommended");
  const [limit, setLimit] = useState(12);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const filters: SearchFilters = {
    location: params.get("location") ?? initialLocation,
    category: params.get("category") ?? initialCategory,
    radius: params.get("radius") || "10",
    salary: params.get("salary") || "",
    type: params.get("type") || "",
    shift: params.get("shift") || "",
    vehicle: params.get("vehicle") || "",
    immediate: params.get("immediate") === "true",
  };
  const [error, setError] = useState("");
  useEffect(() => {
    setText(params.get("location") || initialLocation);
    setLimit(12);
  }, [params.get("location"), initialLocation]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    fetchJobs({ ...filters, sort })
      .then((list) => {
        if (!cancelled) setJobs(list);
      })
      .catch(() => {
        if (!cancelled)
          setLoadError(
            "Could not load jobs from the API. Start the backend on port 5000.",
          );
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
    filters.radius,
    filters.salary,
    filters.type,
    filters.shift,
    filters.vehicle,
    filters.immediate,
    sort,
  ]);
  function change(key: string, value: string | boolean) {
    const next = new URLSearchParams(params.toString());
    if (initialLocation && !next.has("location"))
      next.set("location", initialLocation);
    if (initialCategory && !next.has("category"))
      next.set("category", initialCategory);
    if (value) next.set(key, String(value));
    else next.delete(key);
    const destination = initialCategory ? "/jobs" : path;
    router.replace(`${destination}?${next}`, { scroll: false });
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (/^\d+$/.test(text) && text.length !== 6) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }
    setError("");
    change("location", text.trim());
  }
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumb items={[{ label: "Find jobs" }]} />
          <div className="eyebrow">{uiText("goodWorkCloserToHome2")}</div>
          <h1>
            {heading ||
              `Jobs ${filters.location ? "near " + filters.location : "near you"}`}
          </h1>
          <p>{uiText("findYourFitKnowYourEarningsMakeYourNextMove")}</p>
          <form className="results-search" onSubmit={submit}>
            <div>
              <MapPin size={19} />
              <input
                aria-label={uiText("searchPincodeCityOrArea")}
                placeholder={uiText("pincodeCityOrArea")}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
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
      <div className="container page-content search-layout">
        <aside className="filters-sidebar">
          <div className="row spread">
            <h2>{uiText("filters")}</h2>
            <button
              className="text-link"
              onClick={() =>
                router.replace(
                  `/jobs?${new URLSearchParams({ location: filters.location || "" })}`,
                  { scroll: false },
                )
              }
            >
              {uiText("resetAll")}
            </button>
          </div>
          <JobFilters filters={filters} onChange={change} />
        </aside>
        <section className="results-body">
          <div className="results-toolbar">
            <h2>
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"}{" "}
              <span>
                {filters.location ? `near ${filters.location}` : "to explore"}
              </span>
            </h2>
            <label className="sort-label">
              {uiText("sortBy")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label={uiText("sortJobs")}
              >
                <option value="recommended">{uiText("recommended")}</option>
                <option value="salary">{uiText("highestEarnings")}</option>
                <option
                  value="distance"
                  disabled={
                    !getLocations().some(
                      (l) =>
                        l.pincode === filters.location ||
                        l.locality.toLowerCase() ===
                          filters.location?.toLowerCase(),
                    )
                  }
                >
                  {uiText("nearestFirstPincode")}
                </option>
              </select>
            </label>
          </div>
          <div className="mobile-filters">
            <Sheet>
              <SheetTrigger asChild>
                <button className="button button-outline">
                  <SlidersHorizontal size={16} />
                  {uiText("filters")}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="filter-sheet">
                <SheetHeader>
                  <SheetTitle>{uiText("findYourFit")}</SheetTitle>
                  <SheetDescription>
                    {uiText("chooseTheWorkThatFitsYourDay")}
                  </SheetDescription>
                </SheetHeader>
                <JobFilters filters={filters} onChange={change} />
                <SheetClose asChild>
                  <button className="button button-primary button-full">
                    {uiText("show")} {jobs.length} {uiText("jobs2")}
                  </button>
                </SheetClose>
              </SheetContent>
            </Sheet>
            {["5", "10", "25"].map((v) => (
              <button
                key={v}
                className={`quick-chip ${filters.radius === v ? "selected" : ""}`}
                onClick={() => change("radius", v)}
              >
                {uiText("within")} {v} km
              </button>
            ))}
          </div>
          <div className="active-filters">
            {Object.entries(filters)
              .filter(([k, v]) => v && k !== "location" && k !== "radius")
              .map(([k, v]) => (
                <button key={k} onClick={() => change(k, "")}>
                  {k === "category"
                    ? getCategories().find((c) => c.id === v)?.title
                    : k === "immediate"
                      ? "Immediate joining"
                      : String(v)}
                  <X size={12} />
                </button>
              ))}
          </div>
          {loading ? (
            <p className="notice">Loading jobs…</p>
          ) : loadError ? (
            <EmptyState title="API unavailable" description={loadError} />
          ) : jobs.length ? (
            <>
              <div className="search-job-grid">
                {jobs.slice(0, limit).map((job) => (
                  <JobCard job={job} key={job.id} />
                ))}
              </div>
              {limit < jobs.length && (
                <button
                  className="button button-outline load-more"
                  onClick={() => setLimit((v) => v + 12)}
                >
                  {uiText("showMoreJobs")}
                  <ArrowRight size={16} />
                </button>
              )}
            </>
          ) : (
            <EmptyState
              title={`No matching jobs ${filters.location ? "near " + filters.location : "yet"}`}
              description="Try a wider radius or remove a filter. We’re adding more neighbourhoods to the demo."
            >
              <button
                className="button button-primary"
                onClick={() =>
                  change("radius", Number(filters.radius) < 10 ? "10" : "25")
                }
              >
                {uiText("searchWithin")}{" "}
                {Number(filters.radius) < 10 ? "10" : "25"} km
              </button>
              <button
                className="button button-outline"
                onClick={() => {
                  update((s) => ({ ...s, notices: true }));
                  toast(
                    "Job alert preference saved. Wire push notifications in a later phase.",
                  );
                }}
              >
                <Bell size={16} />
                {uiText("notifyMeAboutJobs")}
              </button>
            </EmptyState>
          )}
          <p className="jobs-demo-note">
            {uiText("demoListingsCompaniesAreFictional")}{" "}
            {filters.salary ? "Salary ranges may overlap. " : ""}
            {uiText("noRealApplicationsAreSent")}
          </p>
        </section>
      </div>
    </>
  );
}
