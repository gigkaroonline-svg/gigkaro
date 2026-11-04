import type { Metadata } from "next";
import { JobSlugPage, loadPublicJob } from "@/features/job-slug-page";
import { JobPage } from "@/features/job-page";
import { decodeJobPlaceSegment } from "@/lib/job-url";
import { jobPageMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ slug: string; city: string }>;
};

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { slug, city: rawCity } = await params;
    const city = decodeJobPlaceSegment(rawCity);
    const job = await loadPublicJob(slug);
    if (!job) {
      return {
        title: "Job",
        robots: { index: false, follow: false },
      };
    }
    const meta = jobPageMetadata(job);
    return {
      ...meta,
      // Place variants stay noindex; canonical remains the clean job path.
      robots: { index: false, follow: true },
      title: `${job.title} in ${city}`,
    };
  } catch {
    return {
      title: "Job",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: PageProps) {
  try {
    const { slug, city: rawCity } = await params;
    return (
      <JobSlugPage slug={slug} placeCity={decodeJobPlaceSegment(rawCity)} />
    );
  } catch {
    return <JobPage />;
  }
}
