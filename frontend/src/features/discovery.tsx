import { uiText } from "@/lib/i18n";
import Link from "next/link";
import { MapPin, ArrowRight, Building2 } from "lucide-react";
import {
  getLocations,
  getPopularLocations,
} from "@/lib/services/locations";
import { getCategoryCounts } from "@/lib/services/jobs";
import { fetchPublicJobsByPincode } from "@/lib/services/api-jobs";
import {
  fetchNearbyLocations,
  fetchPublicLocation,
} from "@/lib/services/api-locations";
import { getCategories } from "@/lib/services/categories";
import { CategoryCard } from "@/components/category-card";
import { JobList } from "@/components/job-card";
import {
  Breadcrumb,
  SectionHeading,
  EmptyState,
} from "@/components/primitives";
import { LocationSearch } from "@/components/search";
export async function PincodePage({ pincode }: { pincode: string }) {
  const place = await fetchPublicLocation(pincode);
  const location = place ?? {
    pincode,
    locality: "",
    city: "",
    state: "",
  };
  const area = location.locality || location.city || pincode;
  const jobs = await fetchPublicJobsByPincode(pincode);
  const companies = [...new Set(jobs.map((j) => j.company))];
  const nearby = await fetchNearbyLocations(location.city, pincode);
  const min = jobs.length ? Math.min(...jobs.map((j) => j.salaryMin)) : 0,
    max = jobs.length ? Math.max(...jobs.map((j) => j.salaryMax)) : 0;
  return (
    <>
      <section className="page-intro">
        <div className="container">
          <Breadcrumb
            items={[
              { label: "Locations", href: "/locations" },
              { label: pincode },
            ]}
          />
          <div className="eyebrow">
            {[location.locality, location.city]
              .filter(Boolean)
              .join(" · ")
              .toUpperCase() || pincode}
          </div>
          <h1>
            {uiText("gigJobsIn2")} {pincode}
          </h1>
          <p>
            {uiText("deliveryWarehouseLogisticsAndFieldJobsAround")} {area}.
          </p>
        </div>
      </section>
      <div className="container section">
        <SectionHeading
          title={`Current jobs in ${area}`}
          href={`/jobs?location=${pincode}&radius=0`}
          action="See all jobs"
        />
        {jobs.length ? (
          <JobList jobs={jobs.slice(0, 6)} />
        ) : (
          <EmptyState
            title={`No jobs in ${pincode} yet`}
            description="Try a wider radius. Your local guide is still here."
          >
            <Link
              className="button button-primary"
              href={`/jobs?location=${pincode}&radius=10`}
            >
              {uiText("searchWithin10Km")}
            </Link>
          </EmptyState>
        )}
      </div>
      <div className="container discovery-columns">
        <section className="panel">
          <h2>{uiText("employersInYourArea")}</h2>
          <div className="employer-list">
            {companies.map((company) => (
              <div key={company}>
                <Building2 size={22} />
                <div>
                  <strong>{company}</strong>
                  <p>
                    {jobs.filter((j) => j.company === company).length}{" "}
                    {uiText("demoOpportunities")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>{uiText("yourLocalWorkGuide")}</h2>
          <p>
            {location.locality && location.city
              ? `${location.locality} ${uiText("isIn")} ${location.city}${
                  location.state ? `, ${location.state}` : ""
                }`
              : `Jobs around ${pincode}.`}
            {uiText("startWithTheExactPincodeToKeepYourCommuteShort")}
          </p>
          <h3 className="subsection-title">{uiText("nearbyAreasPincodes")}</h3>
          <div className="nearby-chips">
            {nearby.length ? (
              nearby.map((l) => (
                <Link key={l.pincode} href={`/jobs/${l.pincode}`}>
                  {l.locality} · {l.pincode}
                  <ArrowRight size={13} />
                </Link>
              ))
            ) : (
              <Link href={`/jobs?location=${location.city}`}>
                {uiText("exploreAllOf")} {location.city}
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
          <h3 className="subsection-title">{uiText("earningsInThisDemo")}</h3>
          <p>
            {uiText("advertisedBaseEarningsRangeFrom")}
            {min.toLocaleString("en-IN")} {uiText("to")}
            {max.toLocaleString("en-IN")}{" "}
            {uiText("perMonthIncentivesAreSeparateAndDependOnTheRole")}
          </p>
        </section>
      </div>
      <section className="container section faq-section">
        <SectionHeading title={`Questions about working in ${pincode}`} />
        {[
          [
            "Can I apply without a resume?",
            "Yes. The application asks for your name, mobile, pincode and a few work preferences. A CV is not required.",
          ],
          [
            "Do I need my own bike?",
            "Only for jobs marked Bike required. Warehouse and some field roles do not require a vehicle.",
          ],
          [
            "What if there are no jobs in my pincode?",
            "The local guide stays available. Search nearby pincodes or widen your radius to discover other opportunities.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
export async function DiscoveryPage({
  kind,
}: {
  kind: "categories" | "locations";
}) {
  const categoryCounts =
    kind === "categories" ? await getCategoryCounts() : {};
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumb
            items={[
              { label: kind === "categories" ? "Categories" : "Locations" },
            ]}
          />
          <div className="eyebrow">{uiText("findWorkThatFitsYourLife")}</div>
          <h1>
            {kind === "categories"
              ? "What kind of work are you looking for?"
              : "Your neighbourhood. Your next opportunity."}
          </h1>
          <p>
            {kind === "categories"
              ? "From last-mile deliveries to your local warehouse, find your kind of gig."
              : "Explore opportunities in your city, area or pincode."}
          </p>
        </div>
      </div>
      <section className="container section">
        {kind === "categories" ? (
          <div className="category-grid">
            {getCategories().map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                count={categoryCounts[c.id] || 0}
              />
            ))}
          </div>
        ) : (
          <>
            <LocationSearch compact />
            <div className="location-grid" style={{ marginTop: 30 }}>
              {getPopularLocations().map((l) => (
                <Link key={l.slug} href={`/jobs?location=${l.city}`}>
                  <Building2 />
                  <div>
                    <h3>{l.city}</h3>
                    <p>{l.state}</p>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 50 }}>
              <SectionHeading title="Browse by pincode" />
              <div className="pincode-grid">
                {getLocations().map((l) => (
                  <Link href={`/jobs/${l.pincode}`} key={l.pincode}>
                    <MapPin size={19} />
                    <div>
                      <strong>{l.pincode}</strong>
                      <p>
                        {l.locality}, {l.city}
                      </p>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
