import { uiText } from "@/lib/i18n";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Zap,
  IndianRupee,
  Bike,
  Boxes,
  BatteryCharging,
  Navigation,
  HeartHandshake,
  Clock3,
  BadgeCheck,
  SlidersHorizontal,
  Wallet,
  Layers,
  LocateFixed,
  Users,
  Sparkles,
  Building2,
} from "lucide-react";
import { LocationSearch } from "@/components/search";
import { CategoryCard } from "@/components/category-card";
import { JobList } from "@/components/job-card";
import { SectionHeading } from "@/components/primitives";
import { getJobs } from "@/lib/services/jobs";
import { getCategories } from "@/lib/services/categories";
import { getPopularLocations } from "@/lib/services/locations";
export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <span className="small-blue-line" />
            {uiText("indiaSPincodeLevelGigHiringNetwork2")}
          </div>
          <h1>
            {uiText("findGigJobs")}
            <br />
            <span>{uiText("closeToHome")}</span>
          </h1>
          <p>
            {uiText("lessTravelMoreEarningDiscoverDeliveryWarehouse")}
            <br className="desktop-break" />{" "}
            {uiText("andOtherGigJobsInYourNeighbourhood")}
          </p>
          <LocationSearch />
          <div className="popular-searches">
            <span>{uiText("popular")}</span>
            {["Delivery", "Warehouse", "EV Rider"].map((v, i) => (
              <Link
                href={`/jobs?category=${["delivery", "warehouse", "ev"][i]}`}
                key={v}
              >
                {v}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label={uiText("nearbyJobExamplesAroundKoramangala")}
        >
          <div className="map-label">
            <MapPin size={14} /> {uiText("yourNextJobIsCloserThanYouThink")}
          </div>
          <div className="map-grid">
            <div className="map-road road-one" />
            <div className="map-road road-two" />
            <span className="map-area area-one">{uiText("koramangala")}</span>
            <span className="map-area area-two">{uiText("hsrLayout")}</span>
            <span className="map-area area-three">{uiText("btmLayout")}</span>
            <div className="map-radius">
              <div className="map-center">
                <MapPin size={25} fill="currentColor" />
                <span>{uiText("youReHere")}</span>
              </div>
            </div>
            <div className="floating-job float-one">
              <span className="icon-tile blue">
                <Bike size={22} />
              </span>
              <div>
                <strong>{uiText("deliveryPartner")}</strong>
                <b>
                  ₹22,000–₹32,000<span> {uiText("month")}</span>
                </b>
                <small>
                  <MapPin size={11} />
                  {uiText("24KmAway")} <i>•</i> {uiText("18Openings")}
                </small>
              </div>
              <span className="float-check">
                <BadgeCheck size={18} />
              </span>
            </div>
            <div className="floating-job float-two">
              <span className="icon-tile orange">
                <Boxes size={22} />
              </span>
              <div>
                <strong>{uiText("warehouseAssociate")}</strong>
                <b>
                  ₹18,000–₹24,000<span> {uiText("month")}</span>
                </b>
                <small className="text-green">
                  <Zap size={11} />
                  {uiText("immediateJoining")}
                </small>
              </div>
            </div>
            <div className="floating-job float-three">
              <span className="icon-tile green">
                <BatteryCharging size={21} />
              </span>
              <div>
                <strong>{uiText("evDeliveryRider")}</strong>
                <small>
                  {uiText("flexibleShifts")} <i>•</i> {uiText("nearYou")}
                </small>
              </div>
              <ArrowRight size={18} />
            </div>
            <span className="map-pin pin-one">
              <MapPin size={19} />
            </span>
            <span className="map-pin pin-two">
              <MapPin size={19} />
            </span>
          </div>
          <div className="hero-visual-footer">
            <span className="mini-avatars">
              <i>RK</i>
              <i>AS</i>
              <i>MD</i>
            </span>
            <p>
              {uiText("yourNeighbourhood2")}
              <br />
              <strong>{uiText("yourNextOpportunity")}</strong>
            </p>
            <span className="kaam">
              {uiText("kaamKaro")}
              <br />
              {uiText("kamao")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
export function HomePage() {
  const jobs = getJobs();
  return (
    <>
      <Hero />
      <section className="trust-strip">
        <div className="container">
          {[
            [MapPin, "Jobs near you"],
            [ShieldCheck, "Verified employers"],
            [Zap, "Quick applications"],
            [IndianRupee, "Always free for candidates"],
          ].map(([Icon, title]) => {
            const I = Icon as typeof MapPin;
            return (
              <div key={String(title)}>
                <I size={20} />
                {title as string}
              </div>
            );
          })}
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="FIND YOUR KIND OF WORK"
          title="A gig for every go-getter."
          description="Choose what works for you. We’ll find it nearby."
          href="/categories"
          action="Explore all categories"
        />
        <div className="category-grid">
          {getCategories().map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              count={
                jobs.filter(
                  (j) => j.category === c.id && j.city === "Bengaluru",
                ).length
              }
            />
          ))}
        </div>
      </section>
      <section className="section jobs-section">
        <div className="container">
          <SectionHeading
            eyebrow="GOOD WORK, RIGHT AROUND THE CORNER"
            title="Your next job could be here."
            description="Fresh opportunities from employers in your neighbourhood."
            href="/jobs?location=560034"
            action="View all jobs"
          />
          <div className="jobs-location-bar">
            <span>
              <MapPin size={16} />
              <strong>{uiText("nearKoramangalaBengaluru")}</strong>
              <span className="location-pin">560034</span>
            </span>
            <Link href="/jobs" className="text-link">
              {uiText("changeLocation")}
            </Link>
          </div>
          <JobList jobs={jobs.slice(0, 3)} />
          <p className="jobs-demo-note">
            {uiText("aPreviewOfWhatSPossibleTheseListingsAreFictional")}
          </p>
        </div>
      </section>
      <section className="section container pincode-section">
        <div>
          <div className="eyebrow">
            {uiText("yourPincodeYourPossibilities")}
          </div>
          <h2>
            {uiText("aShorterCommute")}
            <br />
            {uiText("aBetterWorkday")}
          </h2>
          <p>
            {uiText("goodWorkShouldnTBeFarAwayFindOpportunities")}
            <br className="desktop-break" />{" "}
            {uiText("inTheNeighbourhoodsYouAlreadyKnow")}
          </p>
          <LocationSearch compact initial="560034" />
          <div className="nearby-chips">
            <span>{uiText("exploreNearby")}</span>
            {[
              ["BTM Layout", "560029"],
              ["HSR Layout", "560102"],
              ["Bommanahalli", "560068"],
            ].map(([name, pin]) => (
              <Link key={pin} href={`/jobs/${pin}`}>
                {name}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
        <div className="locality-panel">
          <div className="locality-header">
            <span className="icon-tile blue">
              <LocateFixed />
            </span>
            <div>
              <strong>{uiText("findWorkNearYourPincode")}</strong>
              <p>{uiText("smallRadiusBigPossibilities")}</p>
            </div>
          </div>
          {[
            ["560034", "Koramangala", "8"],
            ["560029", "BTM Layout", "8"],
            ["560102", "HSR Layout", "8"],
          ].map(([pin, area, count]) => (
            <Link key={pin} href={`/jobs/${pin}`} className="locality-row">
              <span>
                <b>{pin}</b>
                <small>{area}</small>
              </span>
              <span>
                {count} {uiText("opportunities")}
                <ArrowUpRightIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section container" id="how-it-works">
        <SectionHeading
          eyebrow="LESS FUSS. MORE POSSIBILITIES."
          title="Your next chapter starts in 3 steps."
        />
        <div className="steps-grid">
          {[
            [
              MapPin,
              "01",
              "Tell us where",
              "Enter your pincode. Find work close to home.",
            ],
            [
              Zap,
              "02",
              "Find your fit",
              "Choose a job. Apply with a few simple details.",
            ],
            [
              HeartHandshake,
              "03",
              "Make your next move",
              "The recruiter contacts you for the next step.",
            ],
          ].map(([Icon, n, title, description]) => {
            const I = Icon as typeof MapPin;
            return (
              <div className="step-card" key={String(n)}>
                <div className="step-top">
                  <span className="icon-tile blue">
                    <I />
                  </span>
                  <span>{n as string}</span>
                </div>
                <h3>{title as string}</h3>
                <p>{description as string}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="section locations-section">
        <div className="container">
          <SectionHeading
            eyebrow="LOCAL WORK. ACROSS INDIA."
            title="Where do you want to work?"
            href="/locations"
            action="Browse jobs by pincode"
          />
          <div className="location-grid">
            {getPopularLocations().map((l) => (
              <Link key={l.slug} href={`/jobs?location=${l.city}`}>
                <Building2 size={24} />
                <div>
                  <h3>{l.city}</h3>
                  <p>
                    {jobs.filter((j) => j.city === l.city).length}{" "}
                    {uiText("demoOpportunities")}
                  </p>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="BUILT AROUND YOUR WORKDAY"
          title="A little local makes a big difference."
        />
        <div className="benefit-grid">
          {[
            [MapPin, "Close to home", "Spend less time travelling."],
            [Zap, "Quick to apply", "No lengthy forms or CV needed."],
            [
              BadgeCheck,
              "Verified opportunities",
              "Employer verification, made visible.",
            ],
            [Clock3, "Work your way", "Full-time, part-time or flexible."],
            [
              Wallet,
              "Know what you’ll earn",
              "Clear earnings before you apply.",
            ],
            [
              Layers,
              "More ways to work",
              "Find the gig that fits your skills.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof MapPin;
            return (
              <div key={String(title)}>
                <I size={23} />
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="section container final-cta">
        <span className="icon-tile blue">
          <MapPin />
        </span>
        <h2>
          {uiText("thereSGoodWorkNearYou")}
          <br />
          {uiText("letSFindIt")}
        </h2>
        <LocationSearch compact />
        <p>{uiText("noRegistrationRequiredToBrowseJobs")}</p>
      </section>
    </>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={15} style={{ transform: "rotate(-35deg)" }} />;
}
