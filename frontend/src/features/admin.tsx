"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileCheck2,
  Building2,
  MapPin,
  Layers,
  ShieldCheck,
  LogOut,
  CheckCircle2,
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

const adminNav = [
  ["overview", "Dashboard", LayoutDashboard],
  ["jobs", "Jobs", BriefcaseBusiness],
  ["applications", "Applications", FileCheck2],
  ["candidates", "Candidates", Users],
  ["companies", "Companies", Building2],
  ["categories", "Categories", Layers],
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

type AdminApplication = {
  id: string;
  name: string;
  mobile: string;
  pincode: string;
  status: string;
  createdAt: string;
  joining?: string;
  job?: Job | null;
  candidate?: { id: string; name: string; mobile: string } | null;
};

function AdminShell({
  view,
  children,
}: {
  view: string;
  children: ReactNode;
}) {
  const { logout, user } = useAuth();
  return (
    <div className="dashboard-background">
      <div className="container dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="workspace-brand">
            <span className="company-avatar slate">
              <ShieldCheck />
            </span>
            <div>
              <strong>GigKaro Admin</strong>
              <small>
                {user?.name || user?.mobile || "Platform workspace"}
              </small>
            </div>
          </div>
          <nav>
            {adminNav.map(([key, label, Icon]) => (
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
            <span className="badge badge-blue">Admin API</span>
            <p>Moderation and pipelines are stored in MongoDB.</p>
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
          <div className="dashboard-heading">
            <div>
              <div className="eyebrow">PLATFORM CONTROL</div>
              <h1>
                {view === "overview"
                  ? "Your network, at a glance."
                  : adminNav.find((v) => v[0] === view)?.[1] || "Admin"}
              </h1>
              <p>Review jobs, applications and directory health.</p>
            </div>
          </div>
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
        "/admin/taxonomy/categories",
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
                  <td>
                    <Link href={jobHref(j)}>{j.title}</Link>
                    <div className="muted">{j.category}</div>
                  </td>
                  <td>{j.company}</td>
                  <td>
                    {j.locality}, {j.pincode}
                  </td>
                  <td>
                    <Badge tone={j.showEverywhere ? "green" : "blue"}>
                      {j.showEverywhere ? "Everywhere" : "Local"}
                    </Badge>
                  </td>
                  <td>
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
                  <td>
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

function AdminApplications({ mode }: { mode: "applications" | "candidates" }) {
  const [rows, setRows] = useState<AdminApplication[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

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

  async function updateStatus(id: string, value: string) {
    try {
      await api(`/admin/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
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
              <th>Job</th>
              <th>{mode === "candidates" ? "Joining" : "Applied"}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.name}</strong>
                  <div className="muted">
                    {a.mobile} · {a.pincode}
                  </div>
                </td>
                <td>
                  {a.job ? (
                    <Link href={jobHref(a.job)}>{a.job.title}</Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {mode === "candidates"
                    ? a.joining || "—"
                    : new Date(a.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td>
                  <select
                    value={a.status}
                    onChange={(e) => updateStatus(a.id, e.target.value)}
                  >
                    {applicationStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && !error && (
        <EmptyState
          title="No applications yet"
          description="When candidates apply, their pipeline appears here."
        />
      )}
    </section>
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
                  <td>
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
                  <td>{c.key}</td>
                  <td>{c.activeJobs}</td>
                  <td>{c.jobs}</td>
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
                  <td>{c.title}</td>
                  <td>{c.activeJobs}</td>
                  <td>{c.jobs}</td>
                  <td>
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
                <td>{view === "pincodes" ? l.pincode : l.locality}</td>
                <td>
                  {view === "pincodes"
                    ? `${l.locality}, ${l.city}`
                    : l.pincode}
                </td>
                <td>{l.activeJobs}</td>
                <td>
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

  if (!user || user.role !== "admin") {
    return (
      <div className="container page-content">
        <EmptyState
          title="Admin sign-in required"
          description="Sign in with an allowlisted admin mobile number or email."
        >
          <Link className="button button-primary" href="/login?role=admin">
            Admin login
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <AdminShell view={view}>
      {view === "overview" ? (
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
              </div>
            </section>
          </div>
        </>
      ) : view === "jobs" ? (
        <AdminModeration />
      ) : view === "applications" || view === "candidates" ? (
        <AdminApplications mode={view} />
      ) : view === "companies" ? (
        <AdminCompanies />
      ) : view === "categories" ? (
        <AdminCategories />
      ) : view === "locations" || view === "pincodes" ? (
        <AdminDirectory view={view} />
      ) : (
        <EmptyState
          title="Page removed"
          description="This admin demo surface was cleaned up. Use Dashboard, Jobs or Applications."
        >
          <Link className="button button-primary" href="/admin">
            Go to dashboard
          </Link>
        </EmptyState>
      )}
    </AdminShell>
  );
}
