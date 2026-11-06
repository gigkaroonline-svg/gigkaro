import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/primitives";
import {
  companyLogoSrc,
  fetchPublicCompanies,
} from "@/lib/services/api-companies";

const audiences = [
  {
    title: "Business",
    body: "Hire frontline teams in the localities where you operate",
    href: "/hire",
    cta: "Start Hiring",
  },
  {
    title: "Worker",
    body: "Find work near you. No resume needed",
    href: "/jobs",
    cta: "Find Jobs",
  },
  {
    title: "Tech / Ops",
    body: "Plug into our API and get candidates straight into your system",
    href: "#api-first",
    cta: "See how it works",
  },
  {
    title: "Partner",
    body: "Build local hiring with us in your city or pincode",
    href: "/contact",
    cta: "Partner With Us",
  },
] as const;

const roleStrip = [
  "Delivery",
  "Quick Commerce",
  "Logistics",
  "Warehousing",
  "Retail",
  "Drivers",
  "EV & Mobility",
  "Field Operations",
] as const;

const comparison = [
  ["Job-posting driven", "Hiring-outcome driven"],
  ["Sell job posts and subscriptions", "Success-based hiring model"],
  ["Candidate database access", "Direct candidate flow to employers"],
  ["Application-focused", "Joining-focused"],
  ["Broad job discovery", "Pincode and locality-focused hiring"],
  ["Often manual workflows", "API-first technology"],
  ["Candidate data as a product", "Hiring outcome as the product"],
] as const;

const stats = [
  ["19,000+", "pincodes covered"],
  ["0", "candidate databases sold"],
  ["1", "outcome that matters: Joining"],
] as const;

const journey = [
  ["Reach", "Find relevant workers in the exact location you need"],
  ["Apply", "Applying is simple, quick and works on any phone"],
  ["Engage", "Connect the worker with the opportunity"],
  ["Screen", "Move the right candidates forward"],
  ["Select", "Support your selection process"],
  ["Join", "Drive the outcome that counts"],
] as const;

const ecosystem = [
  {
    name: "EarlyJobs",
    role: "The Recruitment Network",
    body: "Distributed recruiters for high-volume hiring",
  },
  {
    name: "Huntlo AI",
    role: "AI Hiring Infrastructure",
    body: "Source, engage, screen and hire with AI",
  },
  {
    name: "GigKaro",
    role: "The Gig Hiring Network",
    body: "Frontline execution across pincodes",
  },
] as const;

const values = [
  ["Local first.", "Good work should be close to home."],
  ["Outcomes over activity.", "Joinings, not job posts."],
  ["Workers are people.", "Never products."],
  ["Direct and transparent.", "Candidates go straight to you."],
  ["Built for scale.", "One locality or thousands."],
] as const;

const faqs = [
  {
    q: "Is GigKaro a job portal?",
    a: "No. We don’t sell job posts, subscriptions or candidate databases. Our model is success-based, tied to joinings.",
  },
  {
    q: "How does GigKaro make money?",
    a: "When a candidate successfully joins your company.",
  },
  {
    q: "Do you sell candidate data?",
    a: "Never.",
  },
  {
    q: "How does candidate data reach us?",
    a: "Through API integration, where enabled, directly into your system.",
  },
  {
    q: "Which roles do you cover?",
    a: "Delivery, quick commerce, logistics, warehousing, retail, drivers, EV and mobility, field operations and more.",
  },
  {
    q: "How many pincodes do you cover?",
    a: "19,000+ across India.",
  },
  {
    q: "Who is behind GigKaro?",
    a: "EarlyJobs, operated by Victa EarlyJobs Technologies Private Limited.",
  },
] as const;

const finalCtas = [
  {
    title: "Businesses",
    body: "Need to hire at scale?",
    href: "/hire",
    cta: "Start Hiring",
  },
  {
    title: "Workers",
    body: "Looking for work nearby?",
    href: "/jobs",
    cta: "Find Jobs",
  },
  {
    title: "Partners",
    body: "Want to build local hiring with us?",
    href: "/contact",
    cta: "Partner With Us",
  },
] as const;

export async function AboutPage() {
  const companies = await fetchPublicCompanies();

  return (
    <article className="about-page">
      <section className="container section about-hero">
        <Breadcrumb items={[{ label: "About" }]} />
        <p className="eyebrow">About GigKaro</p>
        <h1>
          Work is local.{" "}
          <span className="about-highlight">Hiring should be too.</span>
        </h1>
        <p className="about-lead">
          GigKaro is India’s pincode-level gig hiring network. We connect
          businesses with frontline workers who live right next door, and we
          measure our success by one thing: people who actually join.
        </p>
        <div className="about-hero-actions">
          <Link className="button button-primary" href="/hire">
            Start Hiring
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link className="button button-outline" href="/jobs">
            Find Jobs near me
          </Link>
        </div>
      </section>

      <section className="container section about-block">
        <p className="eyebrow">Where would you like to start?</p>
        <div className="about-audience">
          {audiences.map((item) => (
            <Link key={item.title} className="about-audience-card" href={item.href}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <span>
                {item.cta}
                <ArrowRight size={14} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section about-block">
        <p className="eyebrow">The roles India runs on</p>
        <ul className="about-role-strip">
          {roleStrip.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
        {companies.length > 0 && (
          <div
            className="about-client-logos"
            aria-label="Companies hiring on GigKaro"
          >
            <div className="about-client-logos-viewport">
              <div className="about-client-logos-track">
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1 ? true : undefined}>
                    {companies
                      .filter((company) => company.key !== "gigkaro")
                      .map((company) => (
                        <li key={`${copy}-${company.key}`}>
                          <Link
                            href={`/jobs/${encodeURIComponent(company.key)}/`}
                            aria-label={`Browse ${company.name} jobs`}
                            tabIndex={copy === 1 ? -1 : undefined}
                          >
                            <img
                              src={companyLogoSrc(company.logo)}
                              alt={company.name}
                              width={96}
                              height={40}
                              decoding="async"
                            />
                          </Link>
                        </li>
                      ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="container section about-block">
        <p className="eyebrow">Our story</p>
        <h2>
          We didn’t start with a product. We started by listening to both sides.
        </h2>
        <p>
          Long before GigKaro had a name, we were sitting across the table from
          businesses. Delivery companies, quick commerce brands, warehouses and
          retailers all told us the same thing: “We need hundreds of people.
          Soon. In these exact areas.”
        </p>
        <p>
          Then we spoke to the other side. Riders, pickers, packers, drivers and
          store staff. They weren’t short of ambition. They were short of a
          simple answer to one question: “What work is there near me?”
        </p>
        <p>
          The demand was real on both sides. The work existed, and so did the
          workers, often just a few kilometres apart. Yet they kept missing each
          other.
        </p>
        <p>
          That’s when we stopped asking “How do we post more jobs?” and started
          asking “How do we help the right person actually start work?”
        </p>
        <p>
          <strong>GigKaro is our answer.</strong>
        </p>
        <blockquote className="about-pullquote">
          <p>“Workers are local. Hiring is often not.”</p>
          <footer>Saurav Kumar, Founder, EarlyJobs</footer>
        </blockquote>
      </section>

      <section className="container section about-block">
        <p className="eyebrow">The problem</p>
        <h2>
          A worker lives in one locality. The opportunity is in another.
        </h2>
        <p>
          A company needs 200 people in one neighbourhood and struggles to reach
          them. A worker three streets away never hears about it. Meanwhile,
          thousands of applications arrive from people who live too far away,
          can’t commute, or never wanted that role.
        </p>
        <p>
          More applications don’t fix this. Being local does.
        </p>
        <p>
          So we organized gig hiring the way people actually live: by city, by
          locality, by pincode.
        </p>
      </section>

      <section className="container section about-block">
        <p className="eyebrow">What makes us different</p>
        <h2>
          We’re not a job portal. We’re built for joinings, not job posts.
        </h2>
        <p>
          A job portal earns when you post, boost, search or subscribe. We earn
          when someone successfully joins. That one difference changes
          everything.
        </p>
        <div
          className="about-table"
          role="table"
          aria-label="GigKaro vs traditional job portals"
        >
          <div className="about-table-head" role="row">
            <span role="columnheader">Traditional job portals</span>
            <span role="columnheader">GigKaro</span>
          </div>
          {comparison.map(([left, right]) => (
            <div className="about-table-row" role="row" key={left}>
              <span role="cell">{left}</span>
              <span role="cell">{right}</span>
            </div>
          ))}
        </div>
        <p className="about-emphasis">
          Job portals help you find applications. We help you get joinings.
        </p>
      </section>

      <section className="container section about-block">
        <p className="eyebrow">Hyperlocal by design</p>
        <h2>One city. One locality. One pincode at a time.</h2>
        <p>
          India’s workforce isn’t only in metros. Talent lives in every
          neighbourhood. With coverage across 19,000+ pincodes, we’re building a
          hyperlocal hiring layer so businesses can reach workers where they
          actually live, and workers don’t have to travel far to earn.
        </p>
        <div className="about-stats">
          {stats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section about-block">
        <h2>Applications are a step. Joining is the outcome.</h2>
        <p className="about-flow about-journey-line">
          {journey.map(([step], index) => (
            <span key={step}>
              {index > 0 ? " → " : ""}
              {step}
            </span>
          ))}
        </p>
        <div className="about-steps">
          {journey.map(([title, body]) => (
            <div key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="api-first" className="container section about-block">
        <p className="eyebrow">API-first</p>
        <h2>Your candidates. Your data. Directly to you.</h2>
        <p>
          Where an integration is enabled, a worker’s application flows from
          GigKaro straight into your system through our API. No downloading,
          forwarding or exporting. You stay at the centre of your hiring, and we
          handle reach and execution.
        </p>
        <p className="about-flow">Worker → GigKaro → API → Your system</p>
        <aside className="about-callout">
          <p>
            “We don’t sell candidate data. Workers are people, not data points
            to be sold again and again.”
          </p>
        </aside>
      </section>

      <section className="container section about-block">
        <h2>Built for people on both sides</h2>
        <div className="about-compare">
          <div>
            <h3>For businesses</h3>
            <p>
              You don’t need more resumes. You need people who show up and
              start. High-volume, multi-city, pincode-level, success-based.
            </p>
          </div>
          <div>
            <h3>For workers</h3>
            <p>
              Many of you don’t have a resume, and you don’t spend your day on
              professional networks. You just want to know what work is near
              you. Less travel. Less friction. More local opportunity.
            </p>
          </div>
        </div>
      </section>

      <section className="container section about-block">
        <h2>One ecosystem. Every layer of hiring.</h2>
        <div className="about-trio">
          {ecosystem.map((item) => (
            <div key={item.name}>
              <strong>{item.name}</strong>
              <p className="about-sublabel">{item.role}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <p>
          GigKaro is proudly built by EarlyJobs, a recruitment network made for
          hiring at scale.
        </p>
      </section>

      <section className="container section about-block">
        <h2>What we believe</h2>
        <ul className="about-values">
          {values.map(([title, body]) => (
            <li key={title}>
              <strong>{title}</strong> {body}
            </li>
          ))}
        </ul>
      </section>

      <section className="container section about-block">
        <h2>Vision and mission</h2>
        <p>
          <strong>Vision:</strong> Build the world’s most accessible local
          hiring network for the frontline workforce.
        </p>
        <p>
          <strong>Mission:</strong> Make good work accessible closer to where
          people live, while helping businesses build frontline teams faster.
          More local. More direct. More technology-driven. More
          outcome-focused.
        </p>
      </section>

      <section className="container section about-block">
        <h2>FAQ</h2>
        <div className="about-faq">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container section about-cta">
        <h2>Good work. Closer to home.</h2>
        <p className="about-lead">Join the GigKaro network.</p>
        <div className="about-cta-grid">
          {finalCtas.map((item) => (
            <div key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <Link className="button button-primary" href={item.href}>
                {item.cta}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container section about-footer-note">
        <p className="about-brand">GigKaro</p>
        <p className="about-emphasis">Kaam Karo. Kamao.</p>
        <p>A product of EarlyJobs</p>
      </section>
    </article>
  );
}
