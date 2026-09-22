"use client";
import { uiText } from "@/lib/i18n";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  FileCheck2,
  Bookmark,
  UserRound,
  Settings,
  ArrowRight,
  MapPin,
  BriefcaseBusiness,
  Check,
  ShieldCheck,
  FileText,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDemoStore } from "@/hooks/use-demo-store";
import { jobHref } from "@/lib/services/demo-jobs";
import { getCategories } from "@/lib/services/categories";
import { api } from "@/lib/api";
import { fetchJobs } from "@/lib/services/api-jobs";
import type { Application, Job } from "@/types";
import {
  getProfileCompletion,
  applicationStatuses,
} from "@/lib/services/candidates";
import { JobList } from "@/components/job-card";
import {
  DashboardStatCard,
  EmptyState,
  Badge,
  SectionHeading,
} from "@/components/primitives";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
export function ApplicationStatus({ status }: { status: string }) {
  const index = applicationStatuses.indexOf(
    status as (typeof applicationStatuses)[number],
  );
  return (
    <ol className="application-status">
      {applicationStatuses.map((s, i) => (
        <li key={s} className={i <= index ? "complete" : ""}>
          <span>{i < index ? <Check size={12} /> : i + 1}</span>
          <small>{s === "Contacted" ? "Recruiter contacted" : s}</small>
        </li>
      ))}
    </ol>
  );
}
export function CandidatePage({ view = "overview" }: { view?: string }) {
  const { user, ready, updateProfile, logout } = useAuth();
  const { toast } = useDemoStore();
  const emptyProfile = {
    name: "",
    mobile: "",
    email: "",
    pincode: "560034",
    city: "Bengaluru",
    radius: "10",
    category: "delivery",
    employmentType: "Flexible",
    shift: "Flexible",
    vehicle: "No vehicle required",
    licence: "No",
    dob: "",
  };
  const [profile, setProfile] = useState(emptyProfile);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState<
    (Application & { job?: Job })[]
  >([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [recommended, setRecommended] = useState<Job[]>([]);
  const [notices, setNotices] = useState(false);
  useEffect(() => {
    if (ready && user?.profile) setProfile({ ...emptyProfile, ...user.profile });
  }, [ready, user]);
  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [apps, saved, rec] = await Promise.all([
          api<{ applications: (Application & { job?: Job })[] }>("/applications"),
          api<{ jobs: Job[] }>("/saved"),
          fetchJobs({
            location: user.profile?.pincode || "560034",
            radius: user.profile?.radius || "10",
            category: user.profile?.category || "",
          }),
        ]);
        if (cancelled) return;
        setApplications(apps.applications);
        setSavedJobs(saved.jobs);
        setRecommended(rec.slice(0, 3));
      } catch {
        if (!cancelled) toast("Could not load account data from the API.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user]);
  const completion = getProfileCompletion(profile);
  const nav = [
    ["overview", "Overview", Home],
    ["applications", "My Applications", FileCheck2],
    ["saved", "Saved Jobs", Bookmark],
    ["profile", "My Profile", UserRound],
    ["settings", "Settings", Settings],
  ] as const;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const valid = z
      .object({
        name: z.string().trim().min(2),
        mobile: z.string().regex(/^[6-9]\d{9}$/),
        pincode: z.string().regex(/^[1-9]\d{5}$/),
        email: z.union([z.string().email(), z.literal("")]),
      })
      .safeParse(profile);
    if (!valid.success) {
      setError("Check your name, 10-digit mobile, email and 6-digit pincode.");
      return;
    }
    try {
      await updateProfile(profile);
      setError("");
      toast("Your profile was saved.");
    } catch {
      setError("Could not save profile. Is the API running?");
    }
  }
  if (ready && !user) {
    return (
      <div className="container page-content">
        <EmptyState
          title="Sign in to continue"
          description="Candidate applications, saved jobs and profile live on the API."
        >
          <Link className="button button-primary" href="/login">
            Login
          </Link>
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="account-background">
      <div className="container account-layout">
        <aside className="account-sidebar">
          <div className="account-person">
            <span>
              {(profile.name || "You").slice(0, 1).toUpperCase()}
            </span>
            <strong>{profile.name || "Your workspace"}</strong>
            <small>{uiText("candidateDemo")}</small>
          </div>
          <nav>
            {nav.map(([key, label, Icon]) => (
              <Link
                className={view === key ? "active" : ""}
                key={key}
                href={key === "overview" ? "/candidate" : `/candidate/${key}`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-help">
            <ShieldCheck size={22} />
            <strong>{uiText("alwaysFreeToApply")}</strong>
            <p>{uiText("youShouldNeverPayToGetAJob")}</p>
          </div>
        </aside>
        <section className="account-main">
          <div className="account-title">
            <div className="eyebrow">{uiText("yourNextChapter")}</div>
            <h1>
              {view === "overview"
                ? `Hi ${profile.name?.split(" ")[0] || "there"}`
                : nav.find((n) => n[0] === view)?.[1]}
            </h1>
            <p>
              {view === "overview"
                ? `Let’s find good work near ${profile.pincode}.`
                : view === "applications"
                  ? "Every application. One simple place."
                  : view === "saved"
                    ? "Good opportunities worth coming back to."
                    : view === "profile"
                      ? "A little about you helps us find a better fit."
                      : "Make GigKaro work for you."}
            </p>
          </div>
          {view === "overview" ? (
            <>
              <div className="stat-grid candidate-stats">
                <DashboardStatCard
                  label="Recommended jobs"
                  value={recommended.length}
                  icon={<BriefcaseBusiness />}
                />
                <DashboardStatCard
                  label="My applications"
                  value={applications.length}
                  icon={<FileCheck2 />}
                />
                <DashboardStatCard
                  label="Saved jobs"
                  value={savedJobs.length}
                  icon={<Bookmark />}
                />
                <DashboardStatCard
                  label="Profile complete"
                  value={`${completion}%`}
                  icon={<UserRound />}
                />
              </div>
              <div className="profile-prompt">
                <div>
                  <h3>{uiText("aLittleMoreAboutYouABetterFit")}</h3>
                  <p>
                    {uiText("completeYourProfileToHelpLocalRecruitersKnowYou")}
                  </p>
                </div>
                <Link
                  className="button button-outline"
                  href="/candidate/profile"
                >
                  {uiText("updateProfile")}
                  <ArrowRight size={15} />
                </Link>
              </div>
              <SectionHeading
                title="Recommended for your neighbourhood"
                href={`/jobs?location=${profile.pincode}`}
                action="Explore jobs"
              />
              {recommended.length ? (
                <JobList jobs={recommended} />
              ) : (
                <EmptyState
                  title="Let’s explore a little further."
                  description="Your current preferences have no matches. Try another category or area."
                >
                  <Link className="button button-primary" href="/jobs">
                    {uiText("findJobs")}
                  </Link>
                </EmptyState>
              )}
            </>
          ) : view === "applications" ? (
            <div className="stack">
              {applications.length ? (
                applications.map((app) => {
                  const job = app.job;
                  if (!job) return null;
                  return (
                    <article className="panel application-item" key={app.id}>
                      <div className="row spread">
                        <div>
                          <h3>
                            <Link href={jobHref(job)}>{job.title}</Link>
                          </h3>
                          <p>
                            {job.company} · {job.locality}
                          </p>
                        </div>
                        <Badge tone="blue">{app.status}</Badge>
                      </div>
                      <ApplicationStatus status={app.status} />
                      <p className="application-date">
                        {uiText("applied")}{" "}
                        {new Date(app.createdAt).toLocaleDateString("en-IN")}{" "}
                        {uiText("demoApplication")}
                      </p>
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  title="Your next chapter is waiting."
                  description="Apply to a nearby job and track your application here."
                >
                  <Link className="button button-primary" href="/jobs">
                    {uiText("findMyFirstGig")}
                    <ArrowRight size={16} />
                  </Link>
                </EmptyState>
              )}
            </div>
          ) : view === "saved" ? (
            savedJobs.length ? (
              <JobList jobs={savedJobs} />
            ) : (
              <EmptyState
                title="Save a little possibility."
                description="Tap the bookmark on any job to keep it here for later."
              >
                <Link className="button button-primary" href="/jobs">
                  {uiText("exploreNearbyJobs")}
                </Link>
              </EmptyState>
            )
          ) : view === "profile" ? (
            <form className="stack" onSubmit={save}>
              <section className="panel">
                <h2>{uiText("basicDetails")}</h2>
                <div className="form-grid">
                  {[
                    ["name", "Full name", "text"],
                    ["mobile", "Mobile number", "tel"],
                    ["email", "Email (optional)", "email"],
                    ["dob", "Date of birth (optional)", "date"],
                    ["pincode", "Pincode", "text"],
                    ["city", "City", "text"],
                  ].map(([key, label, type]) => (
                    <div className="form-field" key={key}>
                      <label htmlFor={`profile-${key}`}>{label}</label>
                      <input
                        id={`profile-${key}`}
                        type={type}
                        value={profile[key as keyof typeof profile]}
                        onChange={(e) =>
                          setProfile((v) => ({ ...v, [key]: e.target.value }))
                        }
                        inputMode={
                          key === "mobile" || key === "pincode"
                            ? "numeric"
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel">
                <h2>{uiText("workPreferences")}</h2>
                <div className="form-grid">
                  {[
                    {
                      key: "category",
                      label: "Preferred work",
                      options: getCategories().map((c) => [c.id, c.title]),
                    },
                    {
                      key: "radius",
                      label: "Preferred radius",
                      options: [
                        ["5", "Within 5 km"],
                        ["10", "Within 10 km"],
                        ["25", "Within 25 km"],
                      ],
                    },
                    {
                      key: "employmentType",
                      label: "Job type",
                      options: ["Full-time", "Part-time", "Flexible"].map(
                        (s) => [s, s],
                      ),
                    },
                    {
                      key: "shift",
                      label: "Preferred shift",
                      options: ["Morning", "Evening", "Night", "Flexible"].map(
                        (s) => [s, s],
                      ),
                    },
                    {
                      key: "vehicle",
                      label: "Vehicle",
                      options: [
                        "Bike required",
                        "EV accepted",
                        "No vehicle required",
                      ].map((s) => [s, s]),
                    },
                    {
                      key: "licence",
                      label: "Driving licence",
                      options: [
                        ["Yes", "Yes"],
                        ["No", "No"],
                      ],
                    },
                  ].map((f) => (
                    <div className="form-field" key={f.key}>
                      <label htmlFor={`profile-${f.key}`}>{f.label}</label>
                      <select
                        id={`profile-${f.key}`}
                        value={profile[f.key as keyof typeof profile]}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                      >
                        {f.options.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel">
                <h2>{uiText("yourDocumentsStayPrivate")}</h2>
                <p className="muted">
                  {uiText(
                    "secureDocumentUploadWillBeAvailableWhenTheBackendIs",
                  )}
                </p>
                <div className="document-grid">
                  {["Aadhaar", "PAN", "Driving licence", "Resume"].map((d) => (
                    <div key={d}>
                      <FileText size={23} />
                      <strong>{d}</strong>
                      <span>{uiText("notUploaded")}</span>
                      <Badge>{uiText("comingWithSecureStorage")}</Badge>
                    </div>
                  ))}
                </div>
              </section>
              {error && (
                <p role="alert" className="field-error">
                  {error}
                </p>
              )}
              <button className="button button-primary" type="submit">
                {uiText("saveProfile")}
                <Check size={17} />
              </button>
            </form>
          ) : (
            <div className="stack">
              <section className="panel">
                <h2>{uiText("jobUpdates")}</h2>
                <div className="row spread">
                  <div>
                    <h3>{uiText("nearbyJobAlerts")}</h3>
                    <p>
                      {uiText(
                        "saveYourPreferenceLiveNotificationsArenTActiveInThis",
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={notices}
                    onCheckedChange={(value) => {
                      setNotices(value);
                      toast("Notification preference noted for this session.");
                    }}
                    aria-label={uiText("nearbyJobAlerts")}
                  />
                </div>
              </section>
              <section className="panel">
                <h2>{uiText("language")}</h2>
                <div className="form-field">
                  <label htmlFor="language">
                    {uiText("preferredLanguage")}
                  </label>
                  <select id="language" defaultValue="en">
                    <option value="en">{uiText("english")}</option>
                  </select>
                  <small>
                    {uiText(
                      "hindiKannadaMalayalamTamilTeluguMarathiAndBengaliArePlanned",
                    )}
                  </small>
                </div>
              </section>
              <section className="panel">
                <h2>{uiText("yourDemoAccount")}</h2>
                <p>
                  {uiText(
                    "thisPreviewKeepsYourSavedJobsProfileAndApplicationsIn",
                  )}
                </p>
                <button
                  type="button"
                  className="button button-outline"
                  style={{ marginTop: 20 }}
                  onClick={() => {
                    logout();
                    toast("Signed out.");
                  }}
                >
                  {uiText("signOut")}
                </button>
              </section>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
