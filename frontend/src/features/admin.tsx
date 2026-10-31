"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileCheck2,
  Building2,
  MapPin,
  Layers,
  Newspaper,
  FileSpreadsheet,
  Inbox,
  ListChecks,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Eye,
  EyeOff,
  Activity,
  BarChart3,
} from "lucide-react";
import type { ReactNode } from "react";
import { LogoCropDialog } from "@/components/logo-crop-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { useAuth } from "@/hooks/use-auth";
import { useDemoStore } from "@/hooks/use-demo-store";
import { api, ApiError, apiAssetUrl } from "@/lib/api";
import type { Job } from "@/types";
import { applicationStatuses } from "@/lib/services/candidates";
import {
  DashboardStatCard,
  Badge,
  EmptyState,
  SectionHeading,
} from "@/components/primitives";
import { jobHref } from "@/lib/services/demo-jobs";
import { isStaffRole, roleLabel } from "@/lib/roles";
import { AdminBlogs } from "@/features/admin-blogs";

const adminNav = [
  ["overview", "Dashboard", LayoutDashboard],
  ["traffic", "Traffic", BarChart3],
  ["jobs", "Jobs", BriefcaseBusiness],
  ["applications", "Applications", FileCheck2],
  ["all-applications", "All applications", Inbox],
  ["sheets", "Sheets", FileSpreadsheet],
  ["check-companies", "Check companies", ListChecks],
  ["candidates", "Candidates", Users],
  ["companies", "Companies", Building2],
  ["categories", "Categories", Layers],
  ["blogs", "Blog", Newspaper],
  ["users", "Users", ShieldCheck],
] as const;

const jobStatuses = [
  "Pending approval",
  "Active",
  "Paused",
  "Rejected",
  "Expired",
] as const;

type Summary = {
  jobsByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
  pendingJobs: number;
  activeJobs: number;
  totalApplications: number;
  activePincodes: number;
  funnel: Record<string, number>;
  cities: { city: string; count: number }[];
};

type TrafficSummary = {
  rangeDays: number;
  from: string;
  to: string;
  pageviews: number;
  visitors: number;
  sessions: number;
  events: number;
  topPages: { path: string; count: number }[];
  topSources: { source: string; medium: string; count: number }[];
  topEvents: { name: string; count: number }[];
};

function isoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDay(d);
}

type AdminApplication = {
  id: string;
  name: string;
  mobile: string;
  pincode: string;
  location?: string;
  status: string;
  createdAt: string;
  joining?: string;
  job?: Job | null;
  candidate?: { id: string; name: string; mobile: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  partnerCheck?: {
    status: string;
    clientName: string;
    detail: string;
  } | null;
};

type ManagerHistoryEntry = {
  managerId: string | null;
  name: string;
  email: string;
  startedAt: string;
  endedAt: string | null;
};

type StaffAccount = {
  id: string;
  role: string;
  name: string;
  email: string;
  companyKeys?: string[];
  managerId?: string | null;
  managerName?: string | null;
  managerHistory?: ManagerHistoryEntry[];
};

const recruiterStatusOptions = ["Applied", "Contacted", "Interview"] as const;

function navForRole(role?: string | null) {
  if (role === "hiring_manager") {
    return adminNav.filter(
      ([key]) => key === "applications" || key === "candidates",
    );
  }
  if (role === "recruiter") {
    return adminNav.filter(([key]) => key === "applications");
  }
  return adminNav;
}

function AdminShell({
  view,
  children,
}: {
  view: string;
  children: ReactNode;
}) {
  const { logout, user } = useAuth();
  const nav = navForRole(user?.role);
  return (
    <div className="dashboard-background">
      <div className="container dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="workspace-brand">
            <span className="company-avatar slate">
              <ShieldCheck />
            </span>
            <div>
              <strong>
                {user?.role === "admin" ? "GigKaro Admin" : roleLabel(user?.role)}
              </strong>
              <small>{user?.name || user?.email || "Platform workspace"}</small>
            </div>
          </div>
          <nav>
            {nav.map(([key, label, Icon]) => (
              <Link
                key={key}
                className={key === view ? "active" : ""}
                href={key === "overview" ? "/admin" : `/admin/${key}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="dashboard-sidebar-bottom">
            <span className="badge badge-blue">{roleLabel(user?.role)}</span>
            <p>
              {user?.role === "recruiter"
                ? "Applications for your hiring manager's companies, until one is assigned to another recruiter."
                : user?.role === "hiring_manager"
                  ? "You see every application your recruiters can work."
                  : "Hiring pipeline stored in MongoDB."}
            </p>
            <button
              type="button"
              className="text-link"
              onClick={() => logout()}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>
        <section className="dashboard-main">
          {children}
        </section>
      </div>
    </div>
  );
}

function HiringFunnel({ funnel }: { funnel: Record<string, number> }) {
  const max = Math.max(1, ...applicationStatuses.map((s) => funnel[s] || 0));
  return (
    <section className="panel">
      <h2>Hiring funnel</h2>
      <p>Application stages across the platform.</p>
      <div className="admin-funnel">
        {applicationStatuses.map((s) => (
          <div className="admin-funnel-row" key={s}>
            <div className="row spread">
              <strong>{s}</strong>
              <span>{funnel[s] || 0}</span>
            </div>
            <div className="admin-meter">
              <span
                style={{ width: `${((funnel[s] || 0) / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const EVERYWHERE_VALUE = "__everywhere__";

type AdminCompany = {
  id: string;
  key: string;
  name: string;
  initials: string;
  color: string;
  logo?: string;
  active: boolean;
  jobs: number;
  activeJobs: number;
};

const emptyPostForm = {
  title: "",
  companyId: "",
  category: "delivery",
  pincode: EVERYWHERE_VALUE,
  salaryMin: 15000 as number | "",
  salaryMax: 25000 as number | "",
  openings: 5 as number | "",
  incentiveMax: "" as number | "",
  immediateJoining: true,
  vehicle: "Bike required",
  employmentType: "Full-time",
  shift: "Flexible",
  description:
    "Join this role and start earning. Apply with your nearby pincode.",
  requirements: "Bike, Aadhaar, smartphone",
  showEverywhere: true,
  status: "Active",
};

function AdminPostJob({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(emptyPostForm);
  const [posted, setPosted] = useState<{
    title: string;
    everywhere: boolean;
  } | null>(null);
  const [locations, setLocations] = useState<
    { pincode: string; locality: string; city: string }[]
  >([]);
  const [categories, setCategories] = useState<
    { id: string; title: string }[]
  >([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ locations: typeof locations }>("/admin/taxonomy/locations"),
      api<{ categories: { id: string; title: string }[] }>(
        "/admin/taxonomy/categories?active=1",
      ),
      api<{ companies: AdminCompany[] }>("/admin/companies?active=1"),
    ])
      .then(([loc, cat, cos]) => {
        if (cancelled) return;
        setLocations(loc.locations);
        setCategories(cat.categories);
        setCompanies(cos.companies);
        if (cos.companies[0] && !form.companyId) {
          setForm((f) => ({ ...f, companyId: cos.companies[0].id }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof typeof emptyPostForm>(
    key: K,
    value: (typeof emptyPostForm)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setNumberField(
    key: "salaryMin" | "salaryMax" | "openings" | "incentiveMax",
    value: string,
  ) {
    setField(key, value === "" ? "" : Number(value));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!form.companyId) {
        setError("Select a company.");
        setSaving(false);
        return;
      }
      const everywhere =
        form.pincode === EVERYWHERE_VALUE || form.showEverywhere;
      const pincode = everywhere
        ? locations[0]?.pincode || "560034"
        : form.pincode;
      const requirements = form.requirements
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await api("/admin/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          companyId: form.companyId,
          category: form.category,
          pincode,
          salaryMin: Number(form.salaryMin),
          salaryMax: Number(form.salaryMax),
          openings: Number(form.openings),
          incentiveMax: Number(form.incentiveMax),
          immediateJoining: form.immediateJoining,
          vehicle: form.vehicle,
          employmentType: form.employmentType,
          shift: form.shift,
          description: form.description,
          requirements,
          status: form.status,
          showEverywhere: everywhere,
        }),
      });
      setPosted({ title: form.title.trim(), everywhere });
      setForm({
        ...emptyPostForm,
        companyId: form.companyId,
        pincode: form.pincode,
        category: form.category,
        showEverywhere: everywhere,
      });
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not post job.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel post-form stack">
      <div>
        <h2>Post a job</h2>
        <p className="post-hint">
          Goes live on the public board. Choose “Every location / every pincode”
          so the same job appears wherever users search.
        </p>
      </div>

      <form className="stack" onSubmit={submit}>
        <div>
          <h3>Basics</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="admin-job-title">Title</label>
              <input
                id="admin-job-title"
                required
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Delivery Partner"
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-company">Company</label>
              <SearchableSelect
                id="admin-job-company"
                required
                value={form.companyId}
                placeholder="Select company"
                searchPlaceholder="Search companies…"
                options={companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                  logo: c.logo,
                  initials: c.initials,
                  color: c.color,
                }))}
                onChange={(companyId) => setField("companyId", companyId)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-category">Category</label>
              <select
                id="admin-job-category"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
              >
                {(categories.length
                  ? categories
                  : [{ id: "delivery", title: "Delivery" }]
                ).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-location">Location</label>
              <select
                id="admin-job-location"
                value={
                  form.showEverywhere || form.pincode === EVERYWHERE_VALUE
                    ? EVERYWHERE_VALUE
                    : form.pincode
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === EVERYWHERE_VALUE) {
                    setForm((f) => ({
                      ...f,
                      pincode: EVERYWHERE_VALUE,
                      showEverywhere: true,
                    }));
                  } else {
                    setForm((f) => ({
                      ...f,
                      pincode: value,
                      showEverywhere: false,
                    }));
                  }
                }}
              >
                <option value={EVERYWHERE_VALUE}>
                  Every location / every pincode
                </option>
                {locations.map((l) => (
                  <option key={l.pincode} value={l.pincode}>
                    {l.locality}, {l.city} ({l.pincode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3>Pay & openings</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="admin-job-salary-min">Min salary (₹)</label>
              <input
                id="admin-job-salary-min"
                type="number"
                required
                min={0}
                value={form.salaryMin}
                onChange={(e) => setNumberField("salaryMin", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-salary-max">Max salary (₹)</label>
              <input
                id="admin-job-salary-max"
                type="number"
                required
                min={0}
                value={form.salaryMax}
                onChange={(e) => setNumberField("salaryMax", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-openings">Openings</label>
              <input
                id="admin-job-openings"
                type="number"
                required
                min={1}
                value={form.openings}
                onChange={(e) => setNumberField("openings", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-incentive">Incentive max (₹)</label>
              <input
                id="admin-job-incentive"
                type="number"
                min={0}
                value={form.incentiveMax}
                onChange={(e) => setNumberField("incentiveMax", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3>Role details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="admin-job-type">Job type</label>
              <select
                id="admin-job-type"
                value={form.employmentType}
                onChange={(e) => setField("employmentType", e.target.value)}
              >
                {["Full-time", "Part-time", "Flexible"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-shift">Shift</label>
              <select
                id="admin-job-shift"
                value={form.shift}
                onChange={(e) => setField("shift", e.target.value)}
              >
                {["Morning", "Evening", "Night", "Flexible"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-vehicle">Vehicle</label>
              <select
                id="admin-job-vehicle"
                value={form.vehicle}
                onChange={(e) => setField("vehicle", e.target.value)}
              >
                {[
                  "Bike required",
                  "EV accepted",
                  "No vehicle required",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="admin-job-status">Status</label>
              <select
                id="admin-job-status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                {jobStatuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3>Description</h3>
          <div className="form-grid">
            <div className="form-field form-field-full">
              <label htmlFor="admin-job-description">About the role</label>
              <textarea
                id="admin-job-description"
                required
                rows={4}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>
            <div className="form-field form-field-full">
              <label htmlFor="admin-job-requirements">
                Requirements
              </label>
              <input
                id="admin-job-requirements"
                value={form.requirements}
                onChange={(e) => setField("requirements", e.target.value)}
                placeholder="Bike, Aadhaar, smartphone"
              />
              <small>Comma-separated list.</small>
            </div>
          </div>
        </div>

        <div className="post-form-actions">
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.immediateJoining}
              onChange={(e) =>
                setField("immediateJoining", e.target.checked)
              }
            />
            Immediate joining
          </label>
          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving ? "Posting…" : "Post job"}
          </button>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </form>
      <Dialog
        open={Boolean(posted)}
        onOpenChange={(open) => !open && setPosted(null)}
      >
        <DialogContent className="contact-sent-dialog" showCloseButton={false}>
          <CheckCircle2 size={36} aria-hidden />
          <DialogTitle>Job posted</DialogTitle>
          <DialogDescription>
            {posted?.title
              ? `${posted.title} is live on the board.`
              : "This job is live on the board."}
            {posted?.everywhere
              ? " It will show for every location and pincode search."
              : ""}
          </DialogDescription>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setPosted(null)}
          >
            Done
          </button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AdminModeration() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const data = await api<{ jobs: Job[] }>(
        `/admin/jobs?${params.toString()}`,
      );
      setJobs(data.jobs);
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load jobs.",
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function moderate(id: string, value: string) {
    try {
      await api(`/admin/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      setMessage(`Updated job status to ${value}.`);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update job.",
      );
    }
  }

  return (
    <div className="stack">
      <AdminPostJob onCreated={load} />
    <section className="panel stack">
      <div className="row spread wrap">
        <h2>Job moderation</h2>
        <div className="row wrap">
          <input
            placeholder="Search title, company, pincode"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {jobStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="button button-outline" type="button" onClick={load}>
            Filter
          </button>
        </div>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="notice">{message}</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Company</th>
              <th>Location</th>
              <th>Reach</th>
              <th>Status</th>
              <th>Moderate</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const st = j.status || "Active";
              return (
                <tr key={j.id}>
                  <td data-label="Job">
                    <Link href={jobHref(j)}>{j.title}</Link>
                    <div className="muted">{j.category}</div>
                  </td>
                  <td data-label="Company">{j.company}</td>
                  <td data-label="Location">
                    {j.locality}, {j.pincode}
                  </td>
                  <td data-label="Reach">
                    <Badge tone={j.showEverywhere ? "green" : "blue"}>
                      {j.showEverywhere ? "Everywhere" : "Local"}
                    </Badge>
                  </td>
                  <td data-label="Status">
                    <Badge
                      tone={
                        st === "Active"
                          ? "green"
                          : st === "Pending approval"
                            ? "amber"
                            : "blue"
                      }
                    >
                      {st}
                    </Badge>
                  </td>
                  <td data-label="Moderate">
                    <select
                      aria-label={`Moderate ${j.title}`}
                      value={st}
                      onChange={(e) => moderate(j.id, e.target.value)}
                    >
                      {jobStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!jobs.length && !error && (
        <EmptyState
          title="No jobs match"
          description="Post a job above or clear filters."
        />
      )}
    </section>
    </div>
  );
}

function CheckCompanies() {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ companies: string[]; options: string[] }>("/admin/check-companies")
      .then((data) => {
        if (cancelled) return;
        setOptions(data.options);
        setSelected(data.companies);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load companies.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(name: string) {
    setSaved("");
    setSelected((current) => {
      if (current.includes(name)) return current.filter((item) => item !== name);
      if (current.length >= 5) return current;
      return [...current, name];
    });
  }

  function move(index: number, direction: -1 | 1) {
    setSaved("");
    setSelected((current) => {
      const next = index + direction;
      if (next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const data = await api<{ companies: string[] }>("/admin/check-companies", {
        method: "PUT",
        body: JSON.stringify({ companies: selected }),
      });
      setSelected(data.companies);
      setSaved("Saved. Priority 1 is checked first.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save companies.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel stack">
      <h2>Partner companies to check</h2>
      <p className="muted">
        Each GigKaro application and each sheet row is checked with these five companies, in this
        order. Priority 1 is checked first. The referral uses the first locality that company
        returns for the city.
      </p>
      <form onSubmit={save} className="stack">
        <p className="muted">{selected.length} of 5 selected</p>
        <div className="check-company-picks">
          {options.map((name) => (
            <label key={name} className="company-pick">
              <input
                type="checkbox"
                checked={selected.includes(name)}
                disabled={!selected.includes(name) && selected.length >= 5}
                onChange={() => toggle(name)}
              />
              {name}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="stack">
            <p className="muted">Priority</p>
            {selected.map((name, index) => (
              <div key={name} className="row spread">
                <strong>
                  {index + 1}. {name}
                </strong>
                <div className="row">
                  <button
                    type="button"
                    className="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={index === selected.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Move down
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {saved && <p className="muted">{saved}</p>}
        <button className="button button-primary" disabled={saving || selected.length !== 5}>
          {saving ? "Saving…" : "Save companies"}
        </button>
      </form>
    </section>
  );
}

function partnerTone(status?: string) {
  if (status === "unique") return "partner-unique";
  if (status === "not_unique") return "partner-referred";
  if (status === "queued" || status === "waiting") return "partner-checking";
  if (status === "needs_locality") return "partner-locality";
  if (status === "failed") return "partner-failed";
  return "";
}

function partnerLabel(status?: string) {
  if (status === "queued" || status === "waiting") return "Checking";
  if (status === "unique") return "Unique";
  if (status === "not_unique") return "Already referred";
  if (status === "needs_locality") return "Needs locality";
  if (status === "failed") return "Check failed";
  return "—";
}

type CombinedApplication = {
  id: string;
  source: "gigkaro" | "sheet";
  sheetName?: string;
  name: string;
  mobile: string;
  company: string;
  priority?: number;
  city: string;
  locality: string;
  jobTitle: string;
  partnerStatus: string;
  detail: string;
  checks?: { company: string; priority: number; status: string; detail: string }[];
  createdAt: string;
};

function AllApplications() {
  const [rows, setRows] = useState<CombinedApplication[]>([]);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    async function load() {
      try {
        const data = await api<{ rows: CombinedApplication[] }>("/admin/all-applications");
        if (cancelled) return;
        setRows(data.rows);
        setError("");
        const pending = data.rows.some(
          (row) =>
            row.partnerStatus === "queued" ||
            row.partnerStatus === "waiting" ||
            row.checks?.some((check) => check.status === "queued" || check.status === "waiting"),
        );
        if (pending) timer = window.setTimeout(() => void load(), 5000);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load applications.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const visible = source ? rows.filter((row) => row.source === source) : rows;

  return (
    <section className="panel stack">
      <div className="row spread">
        <h2>All applications</h2>
        <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Source">
          <option value="">GigKaro and sheets</option>
          <option value="gigkaro">GigKaro</option>
          <option value="sheet">Sheets</option>
        </select>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Candidate</th>
              <th>Mobile</th>
              <th>Company</th>
              <th>Place</th>
              <th>Partner</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td data-label="Source">
                  {row.source === "sheet" ? "Sheet" : "GigKaro"}
                  {row.sheetName && <div className="muted">{row.sheetName}</div>}
                </td>
                <td data-label="Candidate">
                  <strong>{row.name || "—"}</strong>
                  {row.jobTitle && <div className="muted">{row.jobTitle}</div>}
                </td>
                <td data-label="Mobile">{row.mobile || "—"}</td>
                <td data-label="Company">{row.company || "—"}</td>
                <td data-label="Place">
                  {[row.locality, row.city].filter(Boolean).join(", ") || "—"}
                </td>
                <td data-label="Partner">
                  {row.checks?.length ? (
                    <ul className="partner-checks">
                      {row.checks.map((check) => (
                        <li key={`${check.priority}-${check.company}`}>
                          <div>
                            {check.priority ? `${check.priority}. ` : ""}
                            {check.company} ·{" "}
                            <span className={partnerTone(check.status)}>{partnerLabel(check.status)}</span>
                          </div>
                          {check.detail && <div className="muted">{check.detail}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <div>
                        <span className={partnerTone(row.partnerStatus)}>{partnerLabel(row.partnerStatus)}</span>
                      </div>
                      {row.detail && <div className="muted">{row.detail}</div>}
                    </>
                  )}
                </td>
                <td data-label="Added">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visible.length && !error && (
        <EmptyState
          title="No applications yet"
          description="GigKaro applications and rows from connected sheets show up here."
        />
      )}
    </section>
  );
}

function statusChoices(role: string | undefined, current: string) {
  if (role !== "recruiter") return [...applicationStatuses];
  if (current === "Selected" || current === "Joined") return [current];
  if (current === "Applied") return [...recruiterStatusOptions];
  return ["Contacted", "Interview"];
}

function AdminApplications({ mode }: { mode: "applications" | "candidates" }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminApplication[]>([]);
  const [recruiters, setRecruiters] = useState<StaffAccount[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const canAssign = user?.role === "admin" || user?.role === "hiring_manager";

  async function load() {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const data = await api<{ applications: AdminApplication[] }>(
        `/admin/applications?${params.toString()}`,
      );
      setRows(data.applications);
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load applications.",
      );
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  useEffect(() => {
    const timer = window.setInterval(() => {
      const pending = rowsRef.current.some(
        (row) =>
          row.partnerCheck?.status === "queued" || row.partnerCheck?.status === "waiting",
      );
      if (pending) void load();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!canAssign) return;
    api<{ users: StaffAccount[] }>("/admin/staff?role=recruiter")
      .then((data) => setRecruiters(data.users))
      .catch(() => setRecruiters([]));
  }, [canAssign]);

  async function saveLocality(id: string, locality: string, city: string) {
    try {
      await api(`/admin/applications/${id}/partner`, {
        method: "PATCH",
        body: JSON.stringify({
          locality,
          ...(city ? { city } : {}),
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the locality.");
    }
  }
  async function updateApplication(
    id: string,
    body: { status?: string; assignedTo?: string | null },
  ) {
    try {
      await api(`/admin/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not update application.",
      );
    }
  }

  return (
    <section className="panel stack">
      <div className="row spread">
        <h2>{mode === "candidates" ? "Candidates" : "Applications"}</h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All stages</option>
          {applicationStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Mobile</th>
              <th>Job</th>
              <th>{mode === "candidates" ? "Joining" : "Applied"}</th>
              {canAssign && <th>Recruiter</th>}
              <th>Partner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const choices = statusChoices(user?.role, a.status);
              const locked = choices.length === 1 && choices[0] === a.status && user?.role === "recruiter";
              const companyRecruiters = recruiters.filter((recruiter) =>
                a.job?.companyId
                  ? (recruiter.companyKeys || []).includes(a.job.companyId)
                  : true,
              );
              const assigneeOptions =
                a.assignedTo &&
                !companyRecruiters.some((recruiter) => recruiter.id === a.assignedTo?.id)
                  ? [
                      ...companyRecruiters,
                      {
                        id: a.assignedTo.id,
                        name: a.assignedTo.name,
                        email: a.assignedTo.email,
                        role: "recruiter",
                      },
                    ]
                  : companyRecruiters;
              return (
                <tr key={a.id}>
                  <td data-label="Candidate">
                    <strong>{a.name}</strong>
                    <div className="muted">
                      {a.location
                        ? `${a.location} (${a.pincode})`
                        : a.pincode}
                    </div>
                  </td>
                  <td data-label="Mobile">{a.mobile || "—"}</td>
                  <td data-label="Job">
                    {a.job ? (
                      <Link href={jobHref(a.job)}>{a.job.title}</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td data-label={mode === "candidates" ? "Joining" : "Applied"}>
                    {mode === "candidates"
                      ? a.joining || "—"
                      : new Date(a.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </td>
                  {canAssign && (
                    <td data-label="Recruiter">
                      <select
                        value={a.assignedTo?.id || ""}
                        onChange={(e) =>
                          updateApplication(a.id, {
                            assignedTo: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((recruiter) => (
                          <option key={recruiter.id} value={recruiter.id}>
                            {recruiter.name || recruiter.email}
                          </option>
                        ))}
                      </select>
                      {!assigneeOptions.length && (
                        <div className="muted">
                          {user?.role === "hiring_manager"
                            ? "No recruiter on your team covers this company yet."
                            : "No recruiter covers this company yet."}
                        </div>
                      )}
                    </td>
                  )}
                  <td data-label="Partner">
                    <PartnerCell
                      application={a}
                      canFix={user?.role === "admin"}
                      onSave={saveLocality}
                    />
                  </td>
                  <td data-label="Status">
                    {locked ? (
                      <span>{a.status}</span>
                    ) : (
                      <select
                        value={a.status}
                        onChange={(e) =>
                          updateApplication(a.id, { status: e.target.value })
                        }
                      >
                        {choices.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && !error && (
        <EmptyState
          title="No applications yet"
          description={
            user?.role === "recruiter"
              ? "You see unassigned applications for your hiring manager's companies, and any application assigned to you."
              : user?.role === "hiring_manager"
                ? "You see applications for your companies and every application your recruiters can work."
                : "When candidates apply, their pipeline appears here."
          }
        />
      )}
    </section>
  );
}

function PartnerCell({
  application,
  canFix,
  onSave,
}: {
  application: AdminApplication;
  canFix: boolean;
  onSave: (id: string, locality: string, city: string) => Promise<void>;
}) {
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const check = application.partnerCheck;
  if (!check) return <>—</>;
  return (
    <div>
      <div>
        <span className={partnerTone(check.status)}>{partnerLabel(check.status)}</span>
      </div>
      {check.detail && <div className="muted">{check.detail}</div>}
      {canFix && check.status === "needs_locality" && (
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            try {
              await onSave(application.id, locality, city);
            } finally {
              setSaving(false);
            }
          }}
        >
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Partner city"
            aria-label="Partner city"
          />
          <input
            value={locality}
            onChange={(event) => setLocality(event.target.value)}
            placeholder="Partner locality"
            aria-label="Partner locality"
            required
          />
          <button className="button" disabled={saving}>
            {saving ? "Saving…" : "Retry check"}
          </button>
        </form>
      )}
    </div>
  );
}

type PartnerSheet = {
  id: string;
  name: string;
  spreadsheetId: string;
  tab: string;
  columns: {
    name: string;
    phone: string;
    city: string;
    company: string;
    locality: string;
  };
  active: boolean;
  lastError: string;
  lastSyncedAt: string | null;
  rowsSeen: number;
  sheetsConfigured: boolean;
};

const sheetFields = [
  ["name", "Candidate name"],
  ["phone", "Mobile"],
  ["city", "City"],
  ["company", "Partner company"],
  ["locality", "Locality"],
] as const;

function sheetProblem(message: string): { text: string; href?: string } {
  const link = message.match(/https:\/\/console\.(?:developers|cloud)\.google\.com\/\S+/)?.[0];
  if (/has not been used|it is disabled|turned off for this Google project/i.test(message)) {
    return {
      text: "Google Sheets is turned off for this Google project. Enable it, wait a minute, then sync again.",
      href: link || "https://console.cloud.google.com/apis/library/sheets.googleapis.com",
    };
  }
  if (/cannot open that sheet|permission|forbidden/i.test(message)) {
    return {
      text: "This account cannot open that sheet. Share it with the storage service account as a viewer.",
    };
  }
  return { text: message.length > 180 ? `${message.slice(0, 177)}…` : message };
}

const defaultSheetColumns = {
  name: "Name",
  phone: "Phone",
  city: "City",
  company: "Company",
  locality: "Locality",
};

function PartnerSheets() {
  const [sheets, setSheets] = useState<PartnerSheet[]>([]);
  const [configured, setConfigured] = useState(true);
  const [name, setName] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [tab, setTab] = useState("Sheet1");
  const [columns, setColumns] = useState(defaultSheetColumns);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PartnerSheet | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api<{ sheetsConfigured: boolean; sheets: PartnerSheet[] }>(
        "/admin/partner-sheets",
      );
      setSheets(data.sheets);
      setConfigured(data.sheetsConfigured);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load sheets.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addSheet(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/admin/partner-sheets", {
        method: "POST",
        body: JSON.stringify({ name, spreadsheetId, tab, columns }),
      });
      setName("");
      setSpreadsheetId("");
      setTab("Sheet1");
      setColumns(defaultSheetColumns);
      setAddOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add that sheet.");
    } finally {
      setSaving(false);
    }
  }

  async function syncSheet(id: string) {
    setError("");
    try {
      await api(`/admin/partner-sheets/${id}/sync`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sync that sheet.");
      await load();
    }
  }

  async function removeSheet() {
    if (!pendingRemove) return;
    setRemoving(true);
    setError("");
    try {
      await api(`/admin/partner-sheets/${pendingRemove.id}`, { method: "DELETE" });
      setPendingRemove(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove that sheet.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="row spread">
        <h2>Partner sheets</h2>
        <button type="button" className="button button-primary" onClick={() => setAddOpen(true)}>
          Add sheet
        </button>
      </div>
      <p className="muted">
        Share each sheet with the storage service account, then add it here.
      </p>
      {!configured && (
        <p className="field-error" role="alert">
          Google Sheets is not configured on the API yet.
        </p>
      )}
      {error && !addOpen && !pendingRemove && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {sheets.map((sheet) => {
        const problem = sheet.lastError ? sheetProblem(sheet.lastError) : null;
        return (
          <div key={sheet.id} className="row spread">
            <div>
              <strong>{sheet.name}</strong>
              <div className="muted">
                {sheet.tab}
                {sheet.rowsSeen ? ` · ${sheet.rowsSeen} rows` : ""}
              </div>
              <div className="muted">
                {sheetFields
                  .map(([key, label]) => `${label}: ${sheet.columns?.[key] || defaultSheetColumns[key]}`)
                  .join(" · ")}
              </div>
              {problem && (
                <p className="field-error" role="alert">
                  {problem.text}{" "}
                  {problem.href && (
                    <a href={problem.href} target="_blank" rel="noreferrer">
                      Enable Google Sheets
                    </a>
                  )}
                </p>
              )}
            </div>
            <div className="row">
              <button type="button" className="button" onClick={() => syncSheet(sheet.id)}>
                Sync
              </button>
              <button type="button" className="text-link" onClick={() => setPendingRemove(sheet)}>
                Remove
              </button>
            </div>
          </div>
        );
      })}
      {!sheets.length && !error && (
        <EmptyState
          title="No sheets yet"
          description="Add a Google Sheet to check those rows with the partner companies."
        />
      )}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setError("");
        }}
      >
        <DialogContent className="staff-user-dialog">
          <DialogTitle>Add a sheet</DialogTitle>
          <DialogDescription>
            The first row is the header. Enter the header name from that sheet for each field.
          </DialogDescription>
          <form onSubmit={addSheet} className="stack">
            <div className="form-field">
              <label htmlFor="sheet-label">Sheet label</label>
              <input
                id="sheet-label"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="sheet-id">Spreadsheet id</label>
              <input
                id="sheet-id"
                value={spreadsheetId}
                onChange={(event) => setSpreadsheetId(event.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="sheet-tab">Tab name</label>
              <input
                id="sheet-tab"
                value={tab}
                onChange={(event) => setTab(event.target.value)}
                required
              />
            </div>
            {sheetFields.map(([key, label]) => (
              <div className="form-field" key={key}>
                <label htmlFor={`sheet-col-${key}`}>{label}</label>
                <input
                  id={`sheet-col-${key}`}
                  value={columns[key]}
                  onChange={(event) =>
                    setColumns((current) => ({ ...current, [key]: event.target.value }))
                  }
                  required
                />
              </div>
            ))}
            {error && addOpen && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button className="button button-primary" disabled={saving}>
              {saving ? "Adding…" : "Add sheet"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pendingRemove}
        onOpenChange={(open) => {
          if (open || removing) return;
          setPendingRemove(null);
          setError("");
        }}
      >
        <DialogContent className="staff-user-dialog">
          <DialogTitle>Remove this sheet?</DialogTitle>
          <DialogDescription>
            {pendingRemove?.name} will stop syncing. Rows already checked stay in All applications.
          </DialogDescription>
          {error && pendingRemove && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="row">
            <button
              type="button"
              className="button"
              disabled={removing}
              onClick={() => {
                setPendingRemove(null);
                setError("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={removing}
              onClick={() => void removeSheet()}
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CompanyPicks({
  companies,
  selected,
  onToggle,
}: {
  companies: AdminCompany[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  if (!companies.length) {
    return <p className="muted">Add a company before assigning one.</p>;
  }
  return (
    <div className="company-picks">
      {companies.map((company) => (
        <label key={company.id} className="company-pick">
          <input
            type="checkbox"
            checked={selected.includes(company.key)}
            onChange={() => onToggle(company.key)}
          />
          <span>{company.name}</span>
        </label>
      ))}
    </div>
  );
}

function AdminStaffUsers() {
  const [users, setUsers] = useState<
    Array<StaffAccount & { mobile?: string; createdAt?: string }>
  >([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"hiring_manager" | "recruiter">("recruiter");
  const [createCompanies, setCreateCompanies] = useState<string[]>([]);
  const [createManager, setCreateManager] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<StaffAccount | null>(null);
  const [assignCompanies, setAssignCompanies] = useState<string[]>([]);
  const [assignManager, setAssignManager] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);
  const [managerUser, setManagerUser] = useState<StaffAccount | null>(null);
  const [managerChoice, setManagerChoice] = useState("");
  const [managerError, setManagerError] = useState("");
  const [managerSaving, setManagerSaving] = useState(false);

  function closeCreate() {
    setCreateOpen(false);
    setError("");
    setShowPassword(false);
  }

  function companyLabel(keys: string[] | undefined) {
    const names = (keys || [])
      .map((key) => companies.find((company) => company.key === key)?.name || key)
      .filter(Boolean);
    return names.length ? names.join(", ") : "None";
  }

  function toggleKey(
    key: string,
    setKeys: Dispatch<SetStateAction<string[]>>,
  ) {
    setKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  async function load() {
    try {
      const [data, companyData] = await Promise.all([
        api<{
          users: Array<StaffAccount & { mobile?: string; createdAt?: string }>;
        }>("/admin/users?role=staff"),
        api<{ companies: AdminCompany[] }>("/admin/companies"),
      ]);
      setUsers(
        data.users.filter((user) => user.role === "hiring_manager" || user.role === "recruiter"),
      );
      setCompanies(companyData.companies);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load users.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          companyKeys: createCompanies,
          ...(role === "recruiter" ? { managerId: createManager } : {}),
        }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("recruiter");
      setCreateCompanies([]);
      setCreateManager("");
      setShowPassword(false);
      setCreateOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the user.");
    } finally {
      setSaving(false);
    }
  }

  function openAssign(account: StaffAccount) {
    setAssignUser(account);
    setAssignCompanies(account.companyKeys || []);
    setAssignManager(account.managerId || "");
    setAssignError("");
  }

  function openManager(account: StaffAccount) {
    setManagerUser(account);
    setManagerChoice(account.managerId || "");
    setManagerError("");
  }

  function formatWhen(value: string | null | undefined) {
    if (!value) return "";
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function saveManager(e: React.FormEvent) {
    e.preventDefault();
    if (!managerUser) return;
    setManagerSaving(true);
    setManagerError("");
    try {
      await api(`/admin/users/${managerUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          companyKeys: managerUser.companyKeys || [],
          managerId: managerChoice,
        }),
      });
      setManagerUser(null);
      await load();
    } catch (err) {
      setManagerError(
        err instanceof ApiError ? err.message : "Could not change the manager.",
      );
    } finally {
      setManagerSaving(false);
    }
  }

  async function saveCompanies(e: React.FormEvent) {
    e.preventDefault();
    if (!assignUser) return;
    setAssignSaving(true);
    setAssignError("");
    try {
      await api(`/admin/users/${assignUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          companyKeys: assignCompanies,
          ...(assignUser.role === "recruiter" ? { managerId: assignManager } : {}),
        }),
      });
      setAssignUser(null);
      await load();
    } catch (err) {
      setAssignError(
        err instanceof ApiError ? err.message : "Could not assign companies.",
      );
    } finally {
      setAssignSaving(false);
    }
  }

  const hiringManagers = users.filter((account) => account.role === "hiring_manager");

  return (
    <div className="stack">
      <section className="panel stack">
        <div className="row spread">
          <h2>Staff</h2>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setCreateOpen(true)}
          >
            Add user
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Companies</th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.id}>
                  <td data-label="Name">{account.name || "—"}</td>
                  <td data-label="Email">{account.email || "—"}</td>
                  <td data-label="Role">{roleLabel(account.role)}</td>
                  <td data-label="Manager">
                    {account.role === "recruiter" ? (
                      <>
                        <div>{account.managerName || "Unassigned"}</div>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => openManager(account)}
                        >
                          Change
                        </button>
                        {(account.managerHistory || []).some((entry) => entry.endedAt) && (
                          <div className="muted">
                            {
                              (account.managerHistory || []).filter((entry) => entry.endedAt)
                                .length
                            }{" "}
                            earlier
                          </div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td data-label="Companies">
                    <div>{companyLabel(account.companyKeys)}</div>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => openAssign(account)}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users.length && !error && (
          <EmptyState
            title="No hiring managers or recruiters yet"
            description="Add a hiring manager, then add recruiters under that manager. Their applications stay visible to the manager."
          />
        )}
      </section>
      <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreate()}>
        <DialogContent className="staff-user-dialog">
          <DialogTitle>Add a hiring manager or recruiter</DialogTitle>
          <DialogDescription>
            They sign in with this email and password. Share the password with them directly.
          </DialogDescription>
          <form onSubmit={createUser} className="stack">
            <div className="form-field">
              <label htmlFor="staff-name">Name</label>
              <input
                id="staff-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="staff-email">Email</label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="staff-password">Temporary password</label>
              <div className="password-field">
                <input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="staff-role">Role</label>
              <select
                id="staff-role"
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value === "hiring_manager" ? "hiring_manager" : "recruiter",
                  )
                }
              >
                <option value="recruiter">Recruiter</option>
                <option value="hiring_manager">Hiring manager</option>
              </select>
            </div>
            {role === "recruiter" && (
              <div className="form-field">
                <label htmlFor="staff-manager">Hiring manager</label>
                <select
                  id="staff-manager"
                  value={createManager}
                  onChange={(e) => setCreateManager(e.target.value)}
                  required
                >
                  <option value="">Select a hiring manager</option>
                  {hiringManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name || manager.email}
                    </option>
                  ))}
                </select>
                {!hiringManagers.length && (
                  <p className="muted">Add a hiring manager before adding a recruiter.</p>
                )}
              </div>
            )}
            <div className="form-field">
              <span className="form-label">
                {role === "recruiter" ? "Extra companies" : "Companies"}
              </span>
              {role === "recruiter" && (
                <p className="muted">
                  This recruiter also sees every company assigned to their hiring manager.
                </p>
              )}
              <CompanyPicks
                companies={companies}
                selected={createCompanies}
                onToggle={(key) => toggleKey(key, setCreateCompanies)}
              />
            </div>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button className="button button-primary" disabled={saving}>
              {saving ? "Saving…" : "Create account"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!assignUser} onOpenChange={(open) => !open && setAssignUser(null)}>
        <DialogContent className="staff-user-dialog">
          <DialogTitle>
            {assignUser?.role === "recruiter" ? "Assign manager and companies" : "Assign companies"}
          </DialogTitle>
          <DialogDescription>
            {assignUser?.role === "recruiter"
              ? `${assignUser.name || assignUser.email} reports to the hiring manager you choose and sees that manager's companies.`
              : `${assignUser?.name || assignUser?.email} sees applications for the companies you select. Recruiters on their team see those applications too.`}
          </DialogDescription>
          <form onSubmit={saveCompanies} className="stack">
            {assignUser?.role === "recruiter" && (
              <div className="form-field">
                <label htmlFor="assign-manager">Hiring manager</label>
                <select
                  id="assign-manager"
                  value={assignManager}
                  onChange={(e) => setAssignManager(e.target.value)}
                  required
                >
                  <option value="">Select a hiring manager</option>
                  {hiringManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name || manager.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <CompanyPicks
              companies={companies}
              selected={assignCompanies}
              onToggle={(key) => toggleKey(key, setAssignCompanies)}
            />
            {assignError && (
              <p className="field-error" role="alert">
                {assignError}
              </p>
            )}
            <button className="button button-primary" disabled={assignSaving}>
              {assignSaving ? "Saving…" : "Save assignment"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!managerUser} onOpenChange={(open) => !open && setManagerUser(null)}>
        <DialogContent className="staff-user-dialog">
          <DialogTitle>Change manager</DialogTitle>
          <DialogDescription>
            {managerUser?.name || managerUser?.email} keeps the earlier managers listed below.
          </DialogDescription>
          <form onSubmit={saveManager} className="stack">
            <div className="form-field">
              <label htmlFor="change-manager">Hiring manager</label>
              <select
                id="change-manager"
                value={managerChoice}
                onChange={(e) => setManagerChoice(e.target.value)}
                required
              >
                <option value="">Select a hiring manager</option>
                {hiringManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name || manager.email}
                  </option>
                ))}
              </select>
              {!hiringManagers.length && (
                <p className="muted">Add a hiring manager before assigning one.</p>
              )}
            </div>
            <div className="stack">
              <strong>History</strong>
              {(managerUser?.managerHistory || []).length ? (
                (managerUser?.managerHistory || []).map((entry) => (
                  <div key={`${entry.managerId}-${entry.startedAt}`}>
                    <div>{entry.name || entry.email || "Manager"}</div>
                    <div className="muted">
                      {formatWhen(entry.startedAt)}
                      {entry.endedAt ? ` – ${formatWhen(entry.endedAt)}` : " – now"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No manager changes yet.</p>
              )}
            </div>
            {managerError && (
              <p className="field-error" role="alert">
                {managerError}
              </p>
            )}
            <button className="button button-primary" disabled={managerSaving || !hiringManagers.length}>
              {managerSaving ? "Saving…" : "Save manager"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminCompanies() {
  const { toast } = useDemoStore();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [cropName, setCropName] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api<{ companies: AdminCompany[] }>("/admin/companies");
      setCompanies(data.companies);
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load companies.",
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  function onPickLogo(file: File | null) {
    if (!file) {
      setLogoFile(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropName(file.name);
    setCropOpen(true);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("name", name);
      if (logoFile) body.append("logo", logoFile);
      await api("/admin/companies", {
        method: "POST",
        body,
      });
      toast("Company added. You can select it when posting a job.");
      setName("");
      setLogoFile(null);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not create company.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel stack">
        <h2>Add company</h2>
        <p className="muted">
          Add the name and a square logo. It will show in the job posting list.
        </p>
        <form className="company-create" onSubmit={create}>
          <div className="form-field">
            <label htmlFor="admin-company-name">Company name</label>
            <input
              id="admin-company-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="SwiftBox"
            />
          </div>
          <div className="form-field company-logo-field">
            <label htmlFor="admin-company-logo">Logo</label>
            <div className="company-logo-row">
              {logoPreview ? (
                <span className="company-logo-preview-wrap">
                  <img
                    className="company-logo-preview"
                    src={logoPreview}
                    alt=""
                  />
                  <button
                    type="button"
                    className="company-logo-remove"
                    aria-label="Remove logo"
                    onClick={() => setLogoFile(null)}
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span className="company-logo-placeholder" aria-hidden>
                  1:1
                </span>
              )}
              <div className="company-logo-controls">
                <input
                  id="admin-company-logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    onPickLogo(e.target.files?.[0] || null);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>
          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Add company"}
          </button>
        </form>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </section>
      <LogoCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        fileName={cropName}
        onOpenChange={(open) => {
          setCropOpen(open);
          if (!open && cropSrc.startsWith("blob:") && !logoFile) {
            URL.revokeObjectURL(cropSrc);
            setCropSrc("");
          }
        }}
        onCropped={(file) => {
          if (cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
          setCropSrc("");
          setLogoFile(file);
          toast("Photo uploaded.");
        }}
      />
      <section className="panel stack">
        <h2>Companies</h2>
        <p className="muted">
          These companies appear in the job posting company dropdown.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Key</th>
                <th>Active jobs</th>
                <th>Total jobs</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td data-label="Company">
                    <span className="company-table-name">
                      {c.logo ? (
                        <img
                          className="company-table-logo"
                          src={apiAssetUrl(c.logo)}
                          alt=""
                        />
                      ) : (
                        <span
                          className={`company-table-avatar ${c.color}`}
                        >
                          {c.initials.slice(0, 2)}
                        </span>
                      )}
                      <span>{c.name}</span>
                    </span>
                  </td>
                  <td data-label="Key">{c.key}</td>
                  <td data-label="Active jobs">{c.activeJobs}</td>
                  <td data-label="Total jobs">{c.jobs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!companies.length && !error && (
          <EmptyState
            title="No companies yet"
            description="Add a company above, then select it when posting a job."
          />
        )}
      </section>
    </div>
  );
}

function AdminCategories() {
  const { toast } = useDemoStore();
  const [categories, setCategories] = useState<
    { id: string; title: string; jobs: number; activeJobs: number }[]
  >([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api<{
        categories: typeof categories;
      }>("/admin/taxonomy/categories");
      setCategories(data.categories);
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load categories.",
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/admin/taxonomy/categories", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      toast("Category added. You can select it when posting a job.");
      setTitle("");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not create category.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel stack">
        <h2>Add category</h2>
        <form className="form-grid" onSubmit={create}>
          <div className="form-field">
            <label htmlFor="admin-category-title">Category name</label>
            <input
              id="admin-category-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Delivery Partner"
            />
          </div>
          <div className="form-field">
            <label htmlFor="admin-category-submit">&nbsp;</label>
            <button
              id="admin-category-submit"
              className="button button-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving…" : "Add category"}
            </button>
          </div>
        </form>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </section>
      <section className="panel stack">
        <h2>Categories</h2>
        <p className="muted">
          These categories appear in the job posting category dropdown.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Active jobs</th>
                <th>Total jobs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td data-label="Category">{c.title}</td>
                  <td data-label="Active jobs">{c.activeJobs}</td>
                  <td data-label="Total jobs">{c.jobs}</td>
                  <td data-label="Jobs">
                    <Link className="text-link" href={`/jobs?category=${c.id}`}>
                      View jobs
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!categories.length && !error && (
          <EmptyState
            title="No categories yet"
            description="Add a category above, then select it when posting a job."
          />
        )}
      </section>
    </div>
  );
}

function AdminDirectory({
  view,
}: {
  view: "locations" | "pincodes";
}) {
  const [locations, setLocations] = useState<
    {
      pincode: string;
      locality: string;
      city: string;
      jobs: number;
      activeJobs: number;
    }[]
  >([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ locations: typeof locations }>(
          "/admin/taxonomy/locations",
        );
        if (!cancelled) {
          setLocations(data.locations);
          setError("");
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof ApiError ? err.message : "Could not load directory.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view]);

  return (
    <section className="panel stack">
      <h2>{view === "pincodes" ? "Pincodes" : "Locations"}</h2>
      <p className="muted">Read-only directory from the live catalog.</p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{view === "pincodes" ? "Pincode" : "Locality"}</th>
              <th>{view === "pincodes" ? "Area" : "Pincode"}</th>
              <th>Active jobs</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.pincode}>
                <td data-label={view === "pincodes" ? "Pincode" : "Locality"}>
                  {view === "pincodes" ? l.pincode : l.locality}
                </td>
                <td data-label={view === "pincodes" ? "Area" : "Pincode"}>
                  {view === "pincodes"
                    ? `${l.locality}, ${l.city}`
                    : l.pincode}
                </td>
                <td data-label="Active jobs">{l.activeJobs}</td>
                <td data-label="Jobs">
                  <Link
                    className="text-link"
                    href={`/jobs?location=${l.pincode}`}
                  >
                    View jobs
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminTraffic() {
  const [preset, setPreset] = useState("30d");
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(isoDay());
  const [traffic, setTraffic] = useState<TrafficSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function applyPreset(value: string) {
    setPreset(value);
    if (value === "custom") return;
    const today = isoDay();
    setTo(today);
    if (value === "today") setFrom(today);
    else if (value === "7d") setFrom(daysAgoIso(6));
    else if (value === "90d") setFrom(daysAgoIso(89));
    else setFrom(daysAgoIso(29));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ from, to, preset });
    api<TrafficSummary>(`/admin/analytics/traffic?${params.toString()}`)
      .then((data) => {
        if (!cancelled) {
          setTraffic(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load traffic analytics.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, preset]);

  return (
    <section className="panel stack">
      <div className="traffic-heading">
        <div>
          <h2>Traffic{loading ? "…" : ""}</h2>
        </div>
        <div className="traffic-filters">
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
            aria-label="Date range preset"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom</option>
          </select>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              setPreset("custom");
              setFrom(e.target.value);
            }}
            aria-label="From date"
          />
          <input
            type="date"
            value={to}
            min={from}
            max={isoDay()}
            onChange={(e) => {
              setPreset("custom");
              setTo(e.target.value);
            }}
            aria-label="To date"
          />
        </div>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="stat-grid">
        <DashboardStatCard
          label="Pageviews"
          value={traffic?.pageviews ?? "—"}
          icon={<Eye />}
        />
        <DashboardStatCard
          label="Visitors"
          value={traffic?.visitors ?? "—"}
          icon={<Users />}
        />
        <DashboardStatCard
          label="Sessions"
          value={traffic?.sessions ?? "—"}
          icon={<Activity />}
        />
        <DashboardStatCard
          label="Events"
          value={traffic?.events ?? "—"}
          icon={<BarChart3 />}
        />
      </div>
      <div className="dashboard-split">
        <section className="panel">
          <SectionHeading title="Top pages" />
          <div className="stack">
            {(traffic?.topPages || []).map((p) => (
              <div className="row spread" key={p.path}>
                <span className="muted" style={{ wordBreak: "break-all" }}>
                  {p.path}
                </span>
                <strong>{p.count}</strong>
              </div>
            ))}
            {!traffic?.topPages?.length && !error && (
              <p className="muted">No pageviews yet.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <SectionHeading title="Traffic sources" />
          <div className="stack">
            {(traffic?.topSources || []).map((s) => (
              <div className="row spread" key={`${s.source}-${s.medium}`}>
                <span>
                  {s.source} / {s.medium}
                </span>
                <strong>{s.count}</strong>
              </div>
            ))}
            {!traffic?.topSources?.length && !error && (
              <p className="muted">No source data yet.</p>
            )}
          </div>
        </section>
      </div>
      <section className="panel">
        <SectionHeading title="Top events" />
        <div className="stack">
          {(traffic?.topEvents || []).map((e) => (
            <div className="row spread" key={e.name}>
              <span>{e.name}</span>
              <strong>{e.count}</strong>
            </div>
          ))}
          {!traffic?.topEvents?.length && !error && (
            <p className="muted">No events yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}

export function AdminPage({ view = "overview" }: { view?: string }) {
  const { user, ready } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || user?.role !== "admin") return;
    if (view !== "overview") return;
    let cancelled = false;
    api<Summary>("/admin/analytics/summary")
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load admin summary.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user, view]);

  if (!ready) {
    return (
      <div className="container page-content">
        <p className="notice">Loading…</p>
      </div>
    );
  }

  if (!user || !isStaffRole(user.role)) {
    return (
      <div className="container page-content">
        <EmptyState
          title="Staff sign-in required"
          description="Admins, hiring managers and recruiters sign in with email and password."
        >
          <Link className="button button-primary" href="/login?role=admin">
            Staff login
          </Link>
        </EmptyState>
      </div>
    );
  }

  const visibleView =
    user.role === "admin"
      ? view
      : user.role === "hiring_manager" &&
          (view === "applications" || view === "candidates")
        ? view
        : user.role === "recruiter" && view === "applications"
          ? view
          : "applications";

  return (
    <AdminShell view={visibleView}>
      {visibleView === "overview" ? (
        <>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="stat-grid">
            <DashboardStatCard
              label="Active jobs"
              value={summary?.activeJobs ?? "—"}
              icon={<BriefcaseBusiness />}
            />
            <DashboardStatCard
              label="Pending review"
              value={summary?.pendingJobs ?? "—"}
              icon={<FileCheck2 />}
            />
            <DashboardStatCard
              label="Applications"
              value={summary?.totalApplications ?? "—"}
              icon={<Users />}
            />
            <DashboardStatCard
              label="Active pincodes"
              value={summary?.activePincodes ?? "—"}
              icon={<MapPin />}
            />
          </div>
          <div className="dashboard-split">
            <HiringFunnel funnel={summary?.funnel || {}} />
            <section className="panel">
              <SectionHeading title="Jobs by city" />
              <div className="stack">
                {(summary?.cities || []).map((c) => (
                  <div className="row spread" key={c.city}>
                    <span>{c.city}</span>
                    <strong>{c.count}</strong>
                  </div>
                ))}
                {!summary?.cities?.length && (
                  <p className="muted">No active jobs yet.</p>
                )}
              </div>
              <div className="row" style={{ marginTop: 16, gap: 12 }}>
                <Link className="button button-outline" href="/admin/jobs">
                  Moderate jobs
                </Link>
                <Link className="text-link" href="/admin/applications">
                  View applications
                </Link>
                <Link className="text-link" href="/admin/traffic">
                  View traffic
                </Link>
              </div>
            </section>
          </div>
        </>
      ) : visibleView === "traffic" ? (
        <AdminTraffic />
      ) : visibleView === "jobs" ? (
        <AdminModeration />
      ) : visibleView === "applications" || visibleView === "candidates" ? (
        <AdminApplications mode={visibleView} />
      ) : visibleView === "all-applications" ? (
        <AllApplications />
      ) : visibleView === "sheets" ? (
        <PartnerSheets />
      ) : visibleView === "check-companies" ? (
        <CheckCompanies />
      ) : visibleView === "companies" ? (
        <AdminCompanies />
      ) : visibleView === "categories" ? (
        <AdminCategories />
      ) : visibleView === "blogs" ? (
        <AdminBlogs />
      ) : visibleView === "users" ? (
        <AdminStaffUsers />
      ) : visibleView === "locations" || visibleView === "pincodes" ? (
        <AdminDirectory view={visibleView} />
      ) : (
        <EmptyState
          title="Page removed"
          description="Use Dashboard, Jobs or Applications."
        >
          <Link className="button button-primary" href="/admin">
            Go to dashboard
          </Link>
        </EmptyState>
      )}
    </AdminShell>
  );
}
