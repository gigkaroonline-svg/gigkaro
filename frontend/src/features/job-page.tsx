"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JobDetail } from "@/features/job-detail";
import { EmptyState } from "@/components/primitives";
import { api } from "@/lib/api";
import type { Job } from "@/types";

export function JobPage() {
  const [job, setJob] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    const slug = window.location.pathname.split("/").filter(Boolean).at(-1);
    if (!slug || slug === "view") {
      setJob(null);
      return;
    }
    let cancelled = false;
    api<{ job: Job }>(`/jobs/${encodeURIComponent(slug)}`, { auth: false })
      .then((data) => {
        if (!cancelled) setJob(data.job);
      })
      .catch(() => {
        if (!cancelled) setJob(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!job) return;
    document.title = `${job.title} in ${job.locality} — ₹${job.salaryMin / 1000}k–₹${job.salaryMax / 1000}k | GigKaro`;
  }, [job]);

  if (job === undefined) {
    return (
      <div className="container page-content" aria-label="Loading job" role="status">
        <div className="skeleton short" />
        <div className="skeleton tall" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container page-content">
        <EmptyState
          title="This opportunity has moved on."
          description="The link may have expired, or this job is no longer available."
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

  return <JobDetail job={job} />;
}
