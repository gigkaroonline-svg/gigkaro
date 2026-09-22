import { uiText } from "@/lib/i18n";
import Link from "next/link";
import {
  MapPin,
  Users,
  Clock3,
  Bike,
  Check,
  Building2,
  FileText,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  Breadcrumb,
  VerifiedEmployerBadge,
  ImmediateJoiningBadge,
  SalaryBadge,
  SectionHeading,
} from "@/components/primitives";
import { SaveJobButton, JobCard } from "@/components/job-card";
import { ApplyButton } from "./application";
import { getJobs } from "@/lib/services/jobs";
import type { Job } from "@/types";
export function JobDetail({ job }: { job: Job }) {
  const similar = getJobs()
    .filter((j) => j.id !== job.id && j.category === job.category)
    .slice(0, 3);
  const nearby = getJobs()
    .filter((j) => j.id !== job.id && j.pincode === job.pincode)
    .slice(0, 3);
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumb
            items={[
              { label: "Find jobs", href: "/jobs" },
              { label: job.title },
            ]}
          />
          <div className="detail-heading">
            <div className={`company-avatar large ${job.color}`}>
              {job.initials}
            </div>
            <div>
              <div className="row">
                <VerifiedEmployerBadge />
                <span className="demo-label">
                  {uiText("fictionalDemoCompany")}
                </span>
              </div>
              <h1>{job.title}</h1>
              <p>
                {job.company}{" "}
                <span className="inline-meta">
                  <MapPin size={15} />
                  {job.locality}, {job.city} · {job.pincode}
                </span>
              </p>
            </div>
            <SaveJobButton id={job.id} />
          </div>
        </div>
      </div>
      <div className="container page-content detail-layout">
        <div className="stack">
          <section className="panel">
            <h2>{uiText("goodWorkClearEarnings")}</h2>
            <div className="detail-earnings">
              <SalaryBadge min={job.salaryMin} max={job.salaryMax} />
              <p>
                {uiText("potentialIncentivesUpTo")}
                {job.incentiveMax.toLocaleString("en-IN")} {uiText("month")}
              </p>
            </div>
            <div className="overview-grid">
              {[
                [Users, `${job.openings} openings`],
                [Clock3, job.employmentType],
                [Bike, job.vehicle],
                [Clock3, `${job.shift} shift`],
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
            <p>{job.description}</p>
            <h3 className="subsection-title">{uiText("whatYouLlDo")}</h3>
            <ul className="check-list">
              <li>
                <Check />
                {uiText("completeYourAssignedWorkWithinYourLocalArea")}
              </li>
              <li>
                <Check />
                {uiText("coordinateWithTheLocalTeamAndFollowSafetyGuidelines")}
              </li>
              <li>
                <Check />
                {uiText("useThePartnerAppToManageDailyTasksAndEarnings")}
              </li>
            </ul>
            <h3 className="subsection-title">{uiText("whatYouLlNeed")}</h3>
            <ul className="check-list">
              {job.requirements.map((r) => (
                <li key={r}>
                  <Check />
                  {r}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>{uiText("workLocation")}</h2>
            <div className="work-location">
              <span className="icon-tile blue">
                <MapPin />
              </span>
              <div>
                <h3>
                  {job.locality}, {job.city}
                </h3>
                <p>
                  {uiText("pincode2")} {job.pincode}{" "}
                  {uiText("localAreaAssignments")}
                </p>
              </div>
            </div>
            <Link className="text-link" href={`/jobs/${job.pincode}`}>
              {uiText("exploreMoreJobsIn")} {job.pincode}
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
            <p className="privacy-note">
              {uiText("doNotShareDocumentNumbersHereDocumentCollectionWillUse")}
            </p>
          </section>
          <section className="panel">
            <h2>
              {uiText("about")} {job.company}
            </h2>
            <p>
              {job.company}{" "}
              {uiText(
                "isAFictionalEmployerCreatedToDemonstrateLocalHiringThis",
              )}
            </p>
          </section>
        </div>
        <aside className="detail-apply panel">
          <VerifiedEmployerBadge />
          <h2>{uiText("readyForYourNextGig")}</h2>
          <SalaryBadge min={job.salaryMin} max={job.salaryMax} />
          <p>
            {job.openings} {uiText("openingsIn")} {job.locality}
          </p>
          <ApplyButton job={job} />
          <div className="privacy-note">
            <ShieldCheck size={16} />
            {uiText("freeToApplyNoCvRequired")}
          </div>
          <div className="notice">
            {uiText("neverPayARecruiterToApplyForAJobThis")}
          </div>
        </aside>
      </div>
      <section className="container section">
        <SectionHeading
          title="More work like this"
          href={`/jobs?category=${job.category}`}
          action="View all similar jobs"
        />
        <div className="job-grid">
          {similar.map((j) => (
            <JobCard job={j} key={j.id} />
          ))}
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          title="More jobs in your neighbourhood"
          href={`/jobs/${job.pincode}`}
          action="Explore nearby jobs"
        />
        <div className="job-grid">
          {nearby.map((j) => (
            <JobCard job={j} key={j.id} />
          ))}
        </div>
      </section>
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
