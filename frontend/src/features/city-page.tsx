import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";
import {
  Breadcrumb,
  EmptyState,
  SectionHeading,
} from "@/components/primitives";
import { CityLocalitiesChips } from "@/features/city-localities-chips";
import { CityOpeningsList } from "@/features/city-openings-list";
import { countLocalityOpenings } from "@/lib/city-openings";
import { fetchJobs } from "@/lib/services/api-jobs";
import {
  citySeoBlurb,
  type CityLocalityEntry,
} from "@/lib/services/locations";

const CITY_IMAGES: Record<string, string> = {
  bengaluru: "/images/cities/bengaluru.jpg",
  delhi: "/images/cities/delhi.jpg",
  mumbai: "/images/cities/mumbai.jpg",
  hyderabad: "/images/cities/hyderabad.jpg",
  chennai: "/images/cities/chennai.jpg",
  pune: "/images/cities/pune.jpg",
  kolkata: "/images/cities/kolkata.jpg",
  ahmedabad: "/images/cities/ahmedabad.jpg",
  jaipur: "/images/cities/jaipur.jpg",
  noida: "/images/cities/noida.jpg",
  lucknow: "/images/cities/lucknow.jpg",
  indore: "/images/cities/indore.jpg",
};

function cityOpeningsHref() {
  return "#city-openings";
}

export async function CityPage({ city }: { city: CityLocalityEntry }) {
  let jobs = [] as Awaited<ReturnType<typeof fetchJobs>>;
  try {
    jobs = await fetchJobs({ location: city.name });
  } catch {
    jobs = [];
  }
  const image = CITY_IMAGES[city.slug];
  const localityOpenings = countLocalityOpenings(jobs, city);
  const localityLabel = `${city.localities.length.toLocaleString("en-IN")} ${
    city.localities.length === 1 ? "locality" : "localities"
  }`;
  const openingLabel = `${localityOpenings.toLocaleString("en-IN")} ${
    localityOpenings === 1 ? "locality opening" : "locality openings"
  }`;

  return (
    <>
      <section className="page-intro city-page-intro">
        <div className="container city-page-intro-layout">
          <div className="city-page-intro-copy">
            <Breadcrumb
              items={[
                { label: "Locations", href: "/locations" },
                { label: city.name },
              ]}
            />
            <div className="eyebrow">
              {localityLabel.toUpperCase()} · {openingLabel.toUpperCase()}
            </div>
            <h1>Gig jobs in {city.name}</h1>
            <p>{citySeoBlurb(city)}</p>
            <div className="city-page-intro-actions">
              <a className="button button-primary" href={cityOpeningsHref()}>
                See jobs in {city.name}
                <ArrowRight size={16} aria-hidden />
              </a>
              <a className="button button-outline" href="#city-localities">
                <MapPinned size={16} aria-hidden />
                Browse localities
              </a>
            </div>
          </div>
          {image ? (
            <div className="city-page-intro-media" aria-hidden>
              <img src={image} alt="" width={420} height={280} />
            </div>
          ) : null}
        </div>
      </section>

      <div className="city-page-body">
        <section id="city-localities" className="container section">
          <SectionHeading
            title={`Localities in ${city.name}`}
            href="#city-openings"
            action="See openings in this city"
          />
          {city.localities.length ? (
            <CityLocalitiesChips
              localities={city.localities}
              city={{ name: city.name, slug: city.slug }}
            />
          ) : (
            <EmptyState
              title={`No localities listed for ${city.name}`}
              description="You can still browse openings listed for this city."
            >
              <a className="button button-primary" href={cityOpeningsHref()}>
                See jobs in {city.name}
              </a>
            </EmptyState>
          )}
        </section>

        <section id="city-openings" className="container section">
          <SectionHeading title={`Openings in ${city.name}`} />
          {jobs.length ? (
            <CityOpeningsList jobs={jobs} city={city} />
          ) : (
            <EmptyState
              title={`No open roles in ${city.name} yet`}
              description="Try a wider search across nearby areas."
            >
              <Link className="button button-primary" href="/jobs">
                Browse all jobs
              </Link>
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
