"use client";
import { uiText } from "@/lib/i18n";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Users,
  FileCheck2,
  UserCheck,
  Check,
  Building2,
  Bell,
} from "lucide-react";
import { useDemoStore } from "@/hooks/use-demo-store";
import { useAuth } from "@/hooks/use-auth";
import {
  getEmployerJobs,
  getDemoApplicants,
  getWorkspaceApplicants,
} from "@/lib/services/employers";
import { getJobs } from "@/lib/services/jobs";
import { applicationStatuses } from "@/lib/services/candidates";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  DashboardStatCard,
  Badge,
  SectionHeading,
  EmptyState,
} from "@/components/primitives";
import { Switch } from "@/components/ui/switch";
export function ApplicantTable({
  view = "applications",
  allEmployers = false,
}: {
  view?: string;
  allEmployers?: boolean;
}) {
  const { state, update, toast } = useDemoStore();
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const applicants = getWorkspaceApplicants(state, !allEmployers);
  const list = applicants.filter(
    (a) =>
      (!filter || (state.statuses[a.id] || a.status) === filter) &&
      `${a.name} ${a.location} ${a.job}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function status(id: string, value: string) {
    update((s) => ({
      ...s,
      statuses: { ...s.statuses, [id]: value },
      applications: s.applications.map((a) =>
        a.id === id ? { ...a, status: value as typeof a.status } : a,
      ),
    }));
    toast("Candidate stage updated in the demo.");
  }
  return (
    <section className="panel data-panel">
      <div className="table-controls">
        <input
          className="control"
          aria-label={uiText("searchCandidates")}
          placeholder={uiText("searchNameRoleOrLocation")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="control"
          aria-label={uiText("applicationStatus")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">{uiText("allStages")}</option>
          {applicationStatuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {list.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{uiText("candidate")}</th>
                <th>{uiText("role")}</th>
                <th>{uiText("location")}</th>
                <th>{view === "candidates" ? "EXPERIENCE" : "APPLIED"}</th>
                <th>{uiText("stage")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                    <small>
                      {a.vehicle} {uiText("demo")}
                    </small>
                  </td>
                  <td>{a.job}</td>
                  <td>
                    {a.location}
                    <small>{a.pincode}</small>
                  </td>
                  <td>{view === "candidates" ? a.experience : a.joined}</td>
                  <td>
                    <select
                      aria-label={`Stage for ${a.name}`}
                      className="table-select"
                      value={state.statuses[a.id] || a.status}
                      onChange={(e) => status(a.id, e.target.value)}
                    >
                      {applicationStatuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No candidates match this view."
          description="Try another name or application stage."
        />
      )}
      <p className="table-footnote">
        {uiText(
          "fictionalCandidatesStageChangesAreVisibleAcrossTheDemoWorkspace",
        )}
      </p>
    </section>
  );
}
export function EmployerJobsTable({ limit }: { limit?: number }) {
  const { state, update, toast } = useDemoStore();
  const { user } = useAuth();
  const existing = getEmployerJobs().map((j) => ({
    id: j.id,
    title: j.title,
    locality: j.locality,
    pincode: j.pincode,
    openings: j.openings,
    status: state.statuses[j.id] || "Active",
    applications: getWorkspaceApplicants(state, true).filter(
      (a) => a.jobId === j.id,
    ).length,
  }));
  const created = state.postedJobs.map((j) => ({
    ...j,
    applications: getWorkspaceApplicants(state, true).filter(
      (a) => a.jobId === j.id,
    ).length,
    status: state.statuses[j.id] || j.status,
  }));
  const all = [...created, ...existing];
  const [filter, setFilter] = useState("");
  const rows = all
    .filter((j) => !filter || j.status === filter)
    .slice(0, limit || all.length);
  return (
    <section className="panel data-panel">
      {!limit && (
        <div className="table-controls">
          <select
            aria-label={uiText("jobStatusFilter")}
            className="control"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">{uiText("allJobs")}</option>
            {["Active", "Paused", "Pending approval", "Rejected"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span>
            {rows.length} {uiText("jobs2")}
          </span>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{uiText("job")}</th>
              <th>{uiText("location")}</th>
              <th>{uiText("openings2")}</th>
              <th>{uiText("applications")}</th>
              <th>{uiText("status")}</th>
              <th>{uiText("expires")}</th>
              <th>{uiText("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id}>
                <td>
                  <strong>
                    {j.id.startsWith("posted_") ? (
                      j.title
                    ) : (
                      <Link href={`/employer/jobs/${j.id}`}>{j.title}</Link>
                    )}
                  </strong>
                  <small>{uiText("demoRequirement")}</small>
                </td>
                <td>
                  {j.locality}
                  <small>{j.pincode}</small>
                </td>
                <td>{j.openings}</td>
                <td>{j.applications}</td>
                <td>
                  <Badge
                    tone={
                      j.status === "Active"
                        ? "green"
                        : j.status === "Pending approval"
                          ? "amber"
                          : "neutral"
                    }
                  >
                    {j.status}
                  </Badge>
                </td>
                <td>
                  {j.status === "Pending approval"
                    ? "After approval"
                    : "17 Oct 2026"}
                </td>
                <td>
                  {!["Active", "Paused"].includes(j.status) ? (
                    user?.role === "admin" ? (
                      <Link href="/admin/jobs" className="text-link">
                        {uiText("review")}
                      </Link>
                    ) : (
                      <span className="muted">Awaiting review</span>
                    )
                  ) : (
                    <button
                      className="text-link"
                      onClick={() => {
                        update((s) => ({
                          ...s,
                          statuses: {
                            ...s.statuses,
                            [j.id]: j.status === "Paused" ? "Active" : "Paused",
                          },
                        }));
                        toast(
                          j.status === "Paused"
                            ? "Job resumed."
                            : "Job paused.",
                        );
                      }}
                    >
                      {j.status === "Paused" ? "Resume" : "Pause"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <EmptyState
          title="No jobs with this status."
          description="Try another status or post your next requirement."
        />
      )}
    </section>
  );
}
export function EmployerPage({ view = "overview" }: { view?: string }) {
  const { state, update, toast } = useDemoStore();
  const [company, setCompany] = useState({
    name: "SwiftBox",
    website: "",
    city: "Bengaluru",
    about: "A fictional local delivery company.",
  });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const savedCompany = localStorage.getItem("gigkaro-company");
      if (savedCompany) setCompany(JSON.parse(savedCompany));
    } catch {}
  }, []);
  const applicants = getWorkspaceApplicants(state, true);
  const stage = (status: string) =>
    applicants.filter((a) => (state.statuses[a.id] || a.status) === status)
      .length;
  const active =
    getEmployerJobs().filter(
      (j) => (state.statuses[j.id] || "Active") === "Active",
    ).length +
    state.postedJobs.filter(
      (j) => (state.statuses[j.id] || j.status) === "Active",
    ).length;
  return (
    <DashboardShell role="employer" view={view}>
      {view === "overview" ? (
        <>
          <div className="stat-grid employer-stats">
            <DashboardStatCard
              label="Active jobs"
              value={active}
              icon={<BriefcaseBusiness />}
            />
            <DashboardStatCard
              label="Applications"
              value={applicants.length}
              icon={<FileCheck2 />}
            />
            <DashboardStatCard
              label="Contacted"
              value={stage("Contacted")}
              icon={<Users />}
            />
            <DashboardStatCard
              label="Selected"
              value={stage("Selected")}
              icon={<UserCheck />}
            />
            <DashboardStatCard
              label="Joined"
              value={stage("Joined")}
              icon={<Check />}
            />
          </div>
          <div className="dashboard-callout">
            <span className="icon-tile blue">
              <MapPinIcon />
            </span>
            <div>
              <h3>{uiText("yourNextGreatHireIsNearby")}</h3>
              <p>{uiText("postARequirementToReachWorkersInYourPincode")}</p>
            </div>
            <Link className="text-link" href="/employer/jobs">
              {uiText("letSHire")}
              <ArrowRight size={16} />
            </Link>
          </div>
          <SectionHeading
            title="Your recent jobs"
            href="/employer/jobs"
            action="Manage all jobs"
          />
          <EmployerJobsTable limit={5} />
        </>
      ) : view === "jobs" ? (
        <EmployerJobsTable />
      ) : view === "applications" || view === "candidates" ? (
        <ApplicantTable view={view} />
      ) : view === "company" ? (
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              localStorage.setItem("gigkaro-company", JSON.stringify(company));
            } catch {}
            setSaved(true);
            toast("Company profile saved on this device.");
          }}
        >
          <h2>{uiText("yourCompanyProfile")}</h2>
          <p className="notice">
            {uiText(
              "thisIsAFictionalEmployerWorkspaceUseSampleBusinessDetails",
            )}
          </p>
          <div className="form-grid" style={{ marginTop: 24 }}>
            {[
              ["name", "Company name"],
              ["website", "Website (optional)"],
              ["city", "City"],
            ].map(([key, label]) => (
              <div className="form-field" key={key}>
                <label htmlFor={`company-${key}`}>{label}</label>
                <input
                  id={`company-${key}`}
                  required={key !== "website"}
                  type={key === "website" ? "url" : "text"}
                  value={company[key as keyof typeof company]}
                  onChange={(e) =>
                    setCompany((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="form-field form-field-full">
              <label htmlFor="company-about">
                {uiText("aboutYourCompany")}
              </label>
              <textarea
                id="company-about"
                value={company.about}
                onChange={(e) =>
                  setCompany((v) => ({ ...v, about: e.target.value }))
                }
              />
            </div>
          </div>
          <button className="button button-primary" style={{ marginTop: 24 }}>
            {saved ? "Save Changes" : "Save Company Profile"}
            <Check size={16} />
          </button>
        </form>
      ) : view === "billing" ? (
        <section className="panel billing-panel">
          <span className="icon-tile blue">
            <Building2 />
          </span>
          <h2>{uiText("exploreHiringWithoutABill")}</h2>
          <p>
            {uiText("thisDemoHasNoPaidPlansSubscriptionsOrPaymentCollection")}
          </p>
          <div className="billing-summary">
            <span>
              {uiText("currentPlan")}
              <strong>{uiText("frontendPreview")}</strong>
            </span>
            <span>
              {uiText("amountDue")}
              <strong>₹0</strong>
            </span>
            <span>
              {uiText("invoices")}
              <strong>{uiText("noInvoices")}</strong>
            </span>
          </div>
        </section>
      ) : (
        <div className="stack">
          <section className="panel">
            <h2>{uiText("hiringUpdates")}</h2>
            <div className="row spread">
              <div>
                <h3>{uiText("applicationNotifications")}</h3>
                <p>{uiText("saveYourPreferenceForFutureHiringUpdates")}</p>
              </div>
              <Switch
                aria-label={uiText("applicationNotifications")}
                checked={state.notices}
                onCheckedChange={(checked) =>
                  update((s) => ({ ...s, notices: checked }))
                }
              />
            </div>
          </section>
          <section className="panel">
            <h2>{uiText("workspaceAccess")}</h2>
            <p>
              {uiText(
                "employerAuthenticationIsADemoProductionRequiresSecureRolesAnd",
              )}
            </p>
            <Link className="text-link" href="/login?role=employer">
              {uiText("openEmployerLogin")}
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
function MapPinIcon() {
  return <Users />;
}
