"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  Users,
  Clock3,
  Bike,
  Check,
  FileText,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import {
  Breadcrumb,
  VerifiedEmployerBadge,
  ImmediateJoiningBadge,
  SalaryBadge,
  SectionHeading,
} from "@/components/primitives";
import { JobCard, CompanyMark } from "@/components/job-card";
import {
  jobFaqItems,
  jobOverviewContent,
  jobPlaceLabel,
} from "@/lib/job-copy";
import { uiText } from "@/lib/i18n";
import { jobCanonicalSlug, jobHrefWithPlace } from "@/lib/job-url";
import { resolvePostedAt } from "@/lib/posted-at";
import {
  cityHubPath,
  getCityBySlug,
  localityHubPath,
  slugifyPlace,
} from "@/lib/services/locations";
import type { Job } from "@/types";
import { ApplyButton } from "./application";

function resolveCitySlug(city: string) {
  const normalized = /delhi/i.test(city)
    ? "delhi"
    : slugifyPlace(city.replace(/\s+ncr$/i, ""));
  return getCityBySlug(normalized)?.slug;
}

export function JobDetail({
  job,
  nearby = [],
  placeCity = "",
  placeLocality = "",
}: {
  job: Job;
  nearby?: Job[];
  placeCity?: string;
  placeLocality?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const city = (
    placeCity ||
    params.get("city") ||
    job.city ||
    ""
  ).trim();
  const locality = (
    placeLocality ||
    params.get("locality") ||
    job.locality ||
    ""
  ).trim();
  const displayJob = { ...job, city, locality };

  // Canonicalize to /job/{city}/{locality}/{slug}/ (lowercase, hyphenated).
  useEffect(() => {
    const qCity = (params.get("city") || "").trim();
    const qLocality = (params.get("locality") || "").trim();
    const segments = path.split("/").filter(Boolean);
    const slug = jobCanonicalSlug(job);
    let nextCity = city;
    let nextLocality = locality;

    if (qCity || qLocality) {
      nextCity = qCity || city;
      nextLocality = qLocality || locality;
    } else if (
      segments[0] === "job" &&
      segments.length >= 3 &&
      segments[1] === slug
    ) {
      // Legacy /job/{slug}/{city}/{locality}/
      nextCity = decodeURIComponent(segments[2] || "");
      nextLocality = decodeURIComponent(segments[3] || "");
    } else if (!(city || locality) || segments.length < 2) {
      return;
    }

    if (!nextCity) return;

    const target = jobHrefWithPlace({
      ...job,
      city: nextCity,
      locality: nextLocality,
    });
    const targetPath = target.split("?")[0].replace(/\/$/, "");
    const currentPath = path.replace(/\/$/, "");
    if (targetPath && targetPath !== currentPath) {
      router.replace(target, { scroll: false });
    }
  }, [params, path, router, job, city, locality]);
  const posted = resolvePostedAt(job.id, job.postedAt);
  const explorePlace = locality || city || job.pincode || "";
  const placeLabel = jobPlaceLabel(displayJob);
  const copyJob = {
    ...displayJob,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    incentiveMax: job.incentiveMax,
  };
  const overview = jobOverviewContent(copyJob);
  const faqs = jobFaqItems(copyJob);
  const citySlug = city ? resolveCitySlug(city) : undefined;
  const exploreHref =
    citySlug && locality
      ? localityHubPath(citySlug, locality)
      : citySlug
        ? cityHubPath(citySlug)
        : "/locations";
  const crumb = [
    { label: "Locations", href: "/locations" },
    ...(city
      ? [
          {
            label: city,
            href: citySlug ? cityHubPath(citySlug) : "/locations",
          },
        ]
      : [{ label: "Find jobs", href: "/jobs" }]),
    ...(locality && citySlug
      ? [
          {
            label: locality,
            href: localityHubPath(citySlug, locality),
          },
        ]
      : locality
        ? [{ label: locality }]
        : []),
    { label: job.title },
  ];
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumb items={crumb} />
          <div className="detail-heading">
            <CompanyMark job={job} large />
            <div>
              <div className="row">
                <VerifiedEmployerBadge />
              </div>
              <h1>
                {placeLabel ? `${job.title} in ${placeLabel}` : job.title}
              </h1>
              <p>
                {job.company}{" "}
                <span className="inline-meta">
                  <MapPin size={15} />
                  {placeLabel || job.pincode}
                  {job.pincode && placeLabel ? ` · ${job.pincode}` : ""}
                </span>
                <span className="inline-meta">
                  <CalendarDays size={15} />
                  Posted {posted.label}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="container page-content detail-layout">
        <div className="stack">
          <section className="panel">
            <h2>{uiText("goodWorkClearEarnings")}</h2>
            <div className="detail-earnings">
              <SalaryBadge min={job.salaryMin} max={job.salaryMax} />
              {job.incentiveMax > 0 && (
                <p>
                  {uiText("potentialIncentivesUpTo")}
                  {job.incentiveMax.toLocaleString("en-IN")} {uiText("month")}
                </p>
              )}
            </div>
            <div className="overview-grid">
              {[
                [Users, `${job.openings} openings`],
                [Clock3, job.employmentType],
                [Bike, job.vehicle],
                [Clock3, `${job.shift} shift`],
                [CalendarDays, `Posted ${posted.label}`],
              ].map(([Icon, value]) => {
                const I = Icon as typeof Users;
                return (
                  <span key={String(value)}>
                    <I size={18} />
                    {value as string}
                  </span>
                );
              })}
            </div>
            {job.immediateJoining && <ImmediateJoiningBadge />}
          </section>
          <section className="panel">
            <h2>{uiText("jobOverview")}</h2>
            <p>{overview.overview}</p>
            <dl className="job-overview-facts">
              {overview.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="subsection-title">Responsibilities</h3>
            <ul className="check-list">
              {overview.responsibilities.map((line) => (
                <li key={line}>
                  <Check />
                  {line}
                </li>
              ))}
            </ul>
            <h3 className="subsection-title">How to apply</h3>
            <p>{overview.howToApply}</p>
            {(job.requirements?.length ?? 0) > 0 && (
              <>
                <h3 className="subsection-title">{uiText("whatYouLlNeed")}</h3>
                <ul className="check-list">
                  {(job.requirements ?? []).map((r) => (
                    <li key={r}>
                      <Check />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
          <section className="panel">
            <h2>{uiText("workLocation")}</h2>
            <div className="work-location">
              <span className="icon-tile blue">
                <MapPin />
              </span>
              <div>
                <h3>{placeLabel || job.pincode}</h3>
                <p>
                  {placeLabel
                    ? `${job.title} openings near ${placeLabel}${
                        job.pincode ? ` · pincode ${job.pincode}` : ""
                      }. Local area assignments with ${job.company}.`
                    : job.pincode
                      ? `${uiText("pincode2")} ${job.pincode} ${uiText("localAreaAssignments")}`
                      : `Openings across ${city || job.city}`}
                </p>
              </div>
            </div>
            <Link className="text-link" href={exploreHref}>
              {uiText("exploreMoreJobsIn")} {explorePlace || "nearby areas"}
              <ArrowRight size={16} />
            </Link>
          </section>
          <section className="panel">
            <h2>{uiText("shiftDetails")}</h2>
            <p>
              {job.shift} {uiText("shifts")} {job.employmentType}
              {uiText(
                "finalTimingsAndIncentiveConditionsAreConfirmedByTheRecruiter",
              )}
            </p>
            <h3 className="subsection-title">{uiText("documentsRequired")}</h3>
            <div className="document-chips">
              <span>
                <FileText size={16} />
                {uiText("identityProof")}
              </span>
              <span>
                <FileText size={16} />
                {uiText("panCard")}
              </span>
              {job.vehicle !== "No vehicle required" && (
                <span>
                  <FileText size={16} />
                  {uiText("drivingLicence")}
                </span>
              )}
            </div>
          </section>
          <section className="panel job-faq-panel">
            <h2>Frequently asked questions</h2>
            <p className="job-faq-intro">
              Common questions about this {job.title} role
              {placeLabel ? ` in ${placeLabel}` : ""} with {job.company}.
            </p>
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        </div>
        <aside className="detail-apply panel">
          <VerifiedEmployerBadge />
          <h2>{uiText("readyForYourNextGig")}</h2>
          <SalaryBadge min={job.salaryMin} max={job.salaryMax} />
          <p>
            {job.openings} {uiText("openingsIn")}{" "}
            {locality || city || job.locality || job.city}
          </p>
          <ApplyButton job={job} />
          <div className="privacy-note">
            <ShieldCheck size={16} />
            {uiText("freeToApplyNoCvRequired")}
          </div>
        </aside>
      </div>
      {nearby.length > 0 && (
        <section className="container section">
          <SectionHeading
            title="More jobs in your neighbourhood"
            href={exploreHref}
            action="Explore nearby jobs"
          />
          <div className="job-grid">
            {nearby.map((row) => (
              <JobCard job={row} key={row.id} />
            ))}
          </div>
        </section>
      )}
      <div className="sticky-apply">
        <div>
          <strong>
            ₹{job.salaryMin / 1000}
            {uiText("k")}
            {job.salaryMax / 1000}k
          </strong>
          <small>{uiText("perMonthIncentives")}</small>
        </div>
        <ApplyButton job={job} sticky />
      </div>
    </>
  );
}
