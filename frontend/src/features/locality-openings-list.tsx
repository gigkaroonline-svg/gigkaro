"use client";

import { useMemo, useState } from "react";
import { JobList } from "@/components/job-card";
import {
  OPENINGS_PAGE_SIZE,
  OpeningsPager,
} from "@/components/openings-pager";
import { jobsForLocalityPlace } from "@/lib/city-openings";
import type { CityLocalityEntry } from "@/lib/services/locations";
import type { Job } from "@/types";

export function LocalityOpeningsList({
  jobs,
  city,
  locality,
}: {
  jobs: Job[];
  city: CityLocalityEntry;
  locality: string;
}) {
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () => jobsForLocalityPlace(jobs, city, locality),
    [jobs, city, locality],
  );
  const pages = Math.max(1, Math.ceil(rows.length / OPENINGS_PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * OPENINGS_PAGE_SIZE;
  const visible = rows.slice(start, start + OPENINGS_PAGE_SIZE);

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
