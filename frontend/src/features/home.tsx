import { uiText } from "@/lib/i18n";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Zap,
  IndianRupee,
  Navigation,
  HeartHandshake,
  Clock3,
  BadgeCheck,
  SlidersHorizontal,
  Wallet,
  Layers,
  Users,
  Sparkles,
  Building2,
} from "lucide-react";
import { LocationSearch } from "@/components/search";
import { CategoryCard } from "@/components/category-card";
import { SectionHeading } from "@/components/primitives";
import { getCategoryCounts } from "@/lib/services/jobs";
import { getCategories } from "@/lib/services/categories";
import { getPopularLocations } from "@/lib/services/locations";
import {
  companyLogoSrc,
  fetchPublicCompanies,
} from "@/lib/services/api-companies";
function DeliveryRider({
  className,
  jacket,
  helmet,
}: {
  className: string;
  jacket: string;
  helmet: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      <span className="delivery-bob">
        <svg viewBox="0 0 128 78" className="delivery-scooter">
          <ellipse cx="64" cy="70" rx="38" ry="4" fill="#1d4e8a" opacity="0.16" />
          <rect x="6" y="30" width="28" height="24" rx="4" fill="#005bd7" />
          <rect x="10" y="34" width="20" height="7" rx="1.5" fill="#9cc7ff" />
          <path d="M20 30v24" stroke="#0047ad" strokeWidth="1.4" />
          <path
            d="M30 56h48c6 0 10-3 14-12"
            fill="none"
            stroke="#17324d"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M40 56c4-12 12-18 24-18h12"
            fill="none"
            stroke="#17324d"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M74 34h18l10 14"
            fill="none"
            stroke="#17324d"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <rect x="42" y="40" width="26" height="8" rx="4" fill="#17324d" />
          <path d="M50 42c2-14 8-20 16-18 6 1 10 6 13 12l8 12-12 3-6-10-8 6z" fill={jacket} />
          <path d="M66 32l16 10" stroke={jacket} strokeWidth="5" strokeLinecap="round" />
          <circle cx="74" cy="18" r="11" fill={helmet} />
          <path d="M66 19h16" stroke="#fff" strokeOpacity="0.75" strokeWidth="2.2" strokeLinecap="round" />
          <g className="scooter-wheel">
            <circle cx="36" cy="60" r="11" fill="#17324d" />
            <circle cx="36" cy="60" r="4.5" fill="#e7eef6" />
            <path d="M36 51v18M27 60h18" stroke="#9aafc4" strokeWidth="1.4" />
          </g>
          <g className="scooter-wheel">
            <circle cx="96" cy="60" r="11" fill="#17324d" />
            <circle cx="96" cy="60" r="4.5" fill="#e7eef6" />
            <path d="M96 51v18M87 60h18" stroke="#9aafc4" strokeWidth="1.4" />
          </g>
        </svg>
      </span>
    </span>
  );
}
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
            <span className="map-pin pin-one">
              <MapPin size={19} />
            </span>
            <span className="map-pin pin-two">
              <MapPin size={19} />
            </span>
            <DeliveryRider
              className="delivery-rider rider-a"
              jacket="#f0b429"
              helmet="#ff7a1a"
            />
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
export async function HomePage() {
  const [categoryCounts, companies] = await Promise.all([
    getCategoryCounts(),
    fetchPublicCompanies(),
  ]);
  return (
    <>
      <Hero />
      {companies.length > 0 && (
        <section className="client-strip" aria-label="We are trusted by">
          <div className="container">
            <p>We are trusted by</p>
            <ul>
              {companies.map((company) => (
                <li key={company.key}>
                  <img src={companyLogoSrc(company.logo)} alt={company.name} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
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
              count={categoryCounts[c.id] || 0}
            />
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
            {getPopularLocations()
              .slice(0, 8)
              .map((l) => (
              <Link key={l.slug} href={`/jobs?location=${l.city}`}>
                <Building2 size={24} />
                <div>
                  <h3>{l.city}</h3>
                  <p>Browse jobs</p>
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
