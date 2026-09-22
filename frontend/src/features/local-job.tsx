"use client";
import { uiText } from "@/lib/i18n";

import { useSearchParams } from "next/navigation";
import { useDemoStore } from "@/hooks/use-demo-store";
import { getAllDemoJobs } from "@/lib/services/demo-jobs";
import { JobDetail } from "./job-detail";
import { EmptyState } from "@/components/primitives";
import Link from "next/link";
export function LocalJob() {
  const params = useSearchParams();
  const { state, ready } = useDemoStore();
  if (!ready)
    return (
      <div className="container section">
        <div className="skeleton tall" />
      </div>
    );
  const job = getAllDemoJobs(state).find((j) => j.id === params.get("id"));
  if (!job)
    return (
      <div className="container section">
        <EmptyState
          title="This local demo job isn’t available here."
          description="New requirements are stored in the browser where they were created."
        >
          <Link className="button button-primary" href="/jobs">
            {uiText("exploreJobs")}
          </Link>
        </EmptyState>
      </div>
    );
  return <JobDetail job={job} />;
}
