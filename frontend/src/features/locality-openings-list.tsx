"use client";

import { useState } from "react";
import { JobList } from "@/components/job-card";
import {
  OPENINGS_PAGE_SIZE,
  OpeningsPager,
} from "@/components/openings-pager";
import type { Job } from "@/types";

export function LocalityOpeningsList({ jobs }: { jobs: Job[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(jobs.length / OPENINGS_PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * OPENINGS_PAGE_SIZE;
  const visible = jobs.slice(start, start + OPENINGS_PAGE_SIZE);

  return (
    <div className="city-openings">
      <JobList jobs={visible} />
      <OpeningsPager
        page={safePage}
        totalPages={pages}
        onChange={setPage}
        scrollToId="locality-openings"
      />
    </div>
  );
}
