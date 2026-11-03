import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Breadcrumb,
  EmptyState,
  SectionHeading,
} from "@/components/primitives";
import { LocalityOpeningsList } from "@/features/locality-openings-list";
import { fetchJobs } from "@/lib/services/api-jobs";
import {
  cityHubPath,
  localitySeoBlurb,
  type CityLocalityEntry,
} from "@/lib/services/locations";

export async function LocalityPage({
  city,
  locality,
}: {
  city: CityLocalityEntry;
  locality: string;
}) {
  let jobs = [] as Awaited<ReturnType<typeof fetchJobs>>;
  try {
    jobs = await fetchJobs({ location: locality });
  } catch {
    jobs = [];
  }
  const openingLabel = `${jobs.length.toLocaleString("en-IN")} ${
    jobs.length === 1 ? "opening" : "openings"
  }`;

  return (
    <>
      <section className="page-intro">
        <div className="container">
          <Breadcrumb
            items={[
              { label: "Locations", href: "/locations" },
              { label: city.name, href: cityHubPath(city.slug) },
              { label: locality },
            ]}
          />
          <div className="eyebrow">
            {city.name.toUpperCase()} · {openingLabel.toUpperCase()}
          </div>
          <h1>Gig jobs in {locality}</h1>
          <p>{localitySeoBlurb(city, locality)}</p>
          <div className="city-page-intro-actions">
            <a className="button button-primary" href="#locality-openings">
              See jobs in {locality}
              <ArrowRight size={16} aria-hidden />
            </a>
            <Link className="button button-outline" href={cityHubPath(city.slug)}>
              Back to {city.name}
            </Link>
          </div>
        </div>
      </section>

      <section
        id="locality-openings"
        className="container section city-page-body"
      >
        <SectionHeading title={`Openings near ${locality}`} />
        {jobs.length ? (
          <LocalityOpeningsList jobs={jobs} />
        ) : (
          <EmptyState
            title={`No open roles in ${locality} yet`}
            description={`Browse other neighbourhoods in ${city.name} or widen your search.`}
          >
            <Link className="button button-primary" href={cityHubPath(city.slug)}>
              Explore {city.name}
            </Link>
          </EmptyState>
        )}
      </section>
    </>
  );
}
