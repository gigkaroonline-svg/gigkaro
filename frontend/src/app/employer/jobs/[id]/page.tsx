import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployerJobs } from "@/lib/services/employers";
import { DashboardShell } from "@/components/dashboard-shell";
import { SalaryBadge, VerifiedEmployerBadge } from "@/components/primitives";
export function generateStaticParams() {
  return getEmployerJobs().map((j) => ({ id: j.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = getEmployerJobs().find((j) => j.id === id);
  if (!job) notFound();
  return (
    <DashboardShell role="employer" view="jobs">
      <section className="panel stack">
        <VerifiedEmployerBadge />
        <h2>{job.title}</h2>
        <p>
          {job.company} · {job.locality}, {job.city} · {job.pincode}
        </p>
        <SalaryBadge min={job.salaryMin} max={job.salaryMax} />
        <p>{job.description}</p>
        <p>
          {job.openings} openings · {job.employmentType} · {job.shift} ·{" "}
          {job.vehicle}
        </p>
        <div className="row">
          <Link className="button button-primary" href="/employer/applications">
            Manage Applications
          </Link>
          <Link className="button button-outline" href={`/job/${job.slug}`}>
            View Public Listing
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
