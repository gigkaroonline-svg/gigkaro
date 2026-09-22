"use client";
import { uiText } from "@/lib/i18n";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jobHref } from "@/lib/services/demo-jobs";
import {
  Bookmark,
  MapPin,
  Clock3,
  Bike,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { useDemoStore } from "@/hooks/use-demo-store";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import type { Job } from "@/types";
import {
  SalaryBadge,
  VerifiedEmployerBadge,
  ImmediateJoiningBadge,
} from "./primitives";

export function SaveJobButton({ id }: { id: string }) {
  const { user } = useAuth();
  const { toast } = useDemoStore();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    api<{ saved: { jobId: string }[] }>("/saved")
      .then((data) => {
        if (!cancelled) setSaved(data.saved.some((s) => s.jobId === id));
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        await api(`/saved/${id}`, { method: "DELETE" });
        setSaved(false);
        toast("Job removed from saved jobs.");
      } else {
        await api(`/saved/${id}`, { method: "POST" });
        setSaved(true);
        toast("Job saved. Find it in your dashboard.");
      }
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Could not update saved jobs.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`icon-button save-button ${saved ? "is-saved" : ""}`}
      aria-label={saved ? "Unsave job" : "Save job"}
      aria-pressed={saved}
      disabled={busy}
      onClick={toggle}
    >
      <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

export function JobCard({
  job,
  compact = false,
}: {
  job: Job;
  compact?: boolean;
}) {
  const active = (job as Job & { status?: string }).status !== "Paused";
  return (
    <article className={`job-card ${compact ? "job-card-compact" : ""}`}>
      <div className="job-card-top">
        <div className={`company-avatar ${job.color}`}>{job.initials}</div>
        <div className="job-heading">
          <h3>
            <Link href={jobHref(job)}>{job.title}</Link>
          </h3>
          <p>
            {job.company} <span className="demo-label">{uiText("demo3")}</span>
          </p>
        </div>
        <SaveJobButton id={job.id} />
      </div>
      <p className="job-location">
        <MapPin size={14} />
        {job.locality}, {job.city}
        <span className="job-pin"> · {job.pincode}</span>
      </p>
      {job.distanceFromSearch ? (
        <p className="job-distance">
          {job.distanceKm <= 0.05
            ? `In selected area · ${job.pincode}`
            : `~${Number(job.distanceKm.toFixed(1))} km from selected area · ${job.pincode}`}
        </p>
      ) : (
        <p className="job-distance">Pincode {job.pincode}</p>
      )}
      <SalaryBadge min={job.salaryMin} max={job.salaryMax} />
      {job.incentiveMax > 0 && (
        <p className="incentive">
          {uiText("upTo")} {job.incentiveMax.toLocaleString("en-IN")}{" "}
          {uiText("inIncentives")}
        </p>
      )}
      <div className="job-tags">
        <span>
          <Clock3 size={13} />
          {job.employmentType}
        </span>
        <span>
          <Bike size={13} />
          {job.vehicle}
        </span>
        <span>
          <Users size={13} />
          {job.openings} {uiText("openings")}
        </span>
      </div>
      <div className="job-badges">
        {job.verified && <VerifiedEmployerBadge />}
        {job.immediateJoining && <ImmediateJoiningBadge />}
        {!active && <span className="badge">Unavailable</span>}
      </div>
      <div className="job-card-bottom">
        <span>{job.postedAt}</span>
        <Link className="apply-link" href={jobHref(job)}>
          Apply Now
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <div className="job-grid">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
