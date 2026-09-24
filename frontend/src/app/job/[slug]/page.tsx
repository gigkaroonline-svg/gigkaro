import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/features/job-detail";
import { fetchPublicJob } from "@/lib/services/api-jobs";
import {
  breadcrumbSchema,
  jobPostingSchema,
  pageMetadata,
} from "@/lib/metadata";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await fetchPublicJob(slug);
  if (!job) {
    return { title: "Job not found", robots: { index: false, follow: false } };
  }
  const pay = `₹${Math.round(job.salaryMin / 1000)}k–₹${Math.round(job.salaryMax / 1000)}k`;
  return pageMetadata(
    `${job.title} in ${job.locality}`,
    `${job.title} at ${job.company} in ${job.locality}, ${job.city}. ${pay} a month. ${job.description}`.slice(
      0,
      160,
    ),
    `/job/${job.slug}`,
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const job = await fetchPublicJob(slug);
  if (!job) notFound();
  const structured = [jobPostingSchema(job), breadcrumbSchema([
    { name: "Find jobs", path: "/jobs" },
    { name: job.title, path: `/job/${job.slug}` },
  ])];
  return (
    <>
      {structured.map((data) => (
        <script
          key={data["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <JobDetail job={job} />
    </>
  );
}
