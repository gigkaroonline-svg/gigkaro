import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/primitives";

const ecosystem = [
  {
    name: "EarlyJobs",
    role: "Recruitment Network & Distribution",
  },
  {
    name: "Huntlo AI",
    role: "AI Hiring Intelligence & Infrastructure",
  },
  {
    name: "GigKaro",
    role: "Gig & Frontline Hiring Execution",
  },
] as const;

const localityLayers = [
  {
    title: "City",
    body: "Find workforce across cities.",
  },
  {
    title: "Locality",
    body: "Reach workers closer to the actual workplace.",
  },
  {
    title: "Pincode",
    body: "Create a hyperlocal hiring layer for frontline roles.",
  },
] as const;

const journey = [
  ["Reach", "Reach relevant workers in the required location."],
  ["Apply", "Make applying simple and accessible."],
  ["Engage", "Connect candidates with the hiring opportunity."],
  ["Screen", "Help move relevant candidates through the hiring process."],
  ["Select", "Support the employer's selection process."],
  ["Join", "Drive the ultimate hiring outcome."],
] as const;

const categories = [
  ["Delivery", "Food delivery, last-mile delivery and delivery partners."],
  ["Quick Commerce", "Dark-store, delivery and local operations."],
  ["Logistics", "Last-mile, transportation and logistics workforce."],
  ["Warehousing", "Warehouse associates, pickers, packers and loaders."],
  ["Retail", "Store associates, sales and frontline retail roles."],
  ["Drivers", "Driver and mobility-related opportunities."],
  ["EV & Mobility", "EV riders, drivers and other mobility roles."],
  ["Field Operations", "Field executives and location-based workforce."],
] as const;

const businessNeeds = [
  "High-volume hiring",
  "Hyperlocal workforce",
  "Faster candidate reach",
  "Multi-city hiring",
  "Pincode-level distribution",
  "API-based candidate flow",
  "Success-based hiring",
  "Scalable frontline recruitment",
] as const;

const workerDiscovery = [
  "Location",
  "Pincode",
  "Locality",
  "Job category",
  "Work type",
  "Hiring company",
] as const;

const comparison = [
  ["Job-posting driven", "Hiring-outcome driven"],
  ["Sell job posts / subscriptions", "Success-based hiring model"],
  ["Candidate database access", "Direct candidate flow to employers"],
  ["Application-focused", "Joining-focused"],
  ["Broad job discovery", "Pincode & locality-focused hiring"],
  ["Often manual recruitment workflows", "API-first technology approach"],
  ["Candidate data as a product layer", "Hiring outcome as the product"],
] as const;

const ecosystemDetail = [
  {
    name: "EarlyJobs",
    label: "The Recruitment Network",
    body: "Connecting companies with a distributed recruitment ecosystem for high-volume hiring.",
  },
  {
    name: "Huntlo AI",
    label: "The AI Hiring Infrastructure",
    body: "Helping recruiters and businesses source, engage, screen and hire talent using AI-powered hiring infrastructure.",
  },
  {
    name: "GigKaro",
    label: "The Gig Hiring Network",
    body: "Connecting businesses with gig and frontline workers across cities, localities and pincodes.",
  },
] as const;

export function AboutPage() {
  return (
    <article className="about-page">
      <section className="container section about-hero">
        <Breadcrumb items={[{ label: "About" }]} />
        <p className="eyebrow">ABOUT GIGKARO</p>
        <h1>India&apos;s Pincode-Level Gig Hiring Network</h1>
        <p className="about-lead">Good Work. Closer to Home.</p>
        <p>
          GigKaro is a pincode-level gig and frontline hiring network, built by
          EarlyJobs, to help businesses discover, engage and hire workers across
          India.
        </p>
        <p>
          From delivery and logistics to quick commerce, warehouses, retail,
          field operations and other frontline roles, GigKaro helps companies
          reach the workforce they need — closer to where people live and work.
        </p>
        <p>
          We are building the infrastructure to make high-volume gig hiring
          faster, more local and more outcome-driven.
        </p>
      </section>

      <section className="container section about-block">
        <h2>Built by EarlyJobs</h2>
        <p>
          GigKaro is a product of EarlyJobs, a recruitment network built for
          high-volume hiring.
        </p>
        <p>
          EarlyJobs combines recruitment distribution, technology and a large
          network of recruiters to help businesses hire at scale.
        </p>
        <p>
          GigKaro extends this capability to the gig, frontline and blue-collar
          workforce, with a specific focus on hyperlocal hiring.
        </p>
        <div className="about-trio">
          {ecosystem.map((item) => (
            <div key={item.name}>
              <strong>{item.name}</strong>
              <p>{item.role}</p>
            </div>
          ))}
        </div>
        <p>
          Together, the ecosystem is designed to address different layers of
          modern hiring — from finding talent to engaging, screening and
          converting candidates into actual joinings.
        </p>
      </section>

      <section className="container section about-block">
        <h2>Why GigKaro Exists</h2>
        <p>
          India has millions of people looking for opportunities in delivery,
          logistics, warehousing, retail, quick commerce, transportation and
          other frontline sectors.
        </p>
        <p>
          At the same time, businesses are hiring thousands of workers every day
          across cities and localities.
        </p>
        <p>
          But there is a fundamental gap.
          <br />
          <strong>Workers are local. Hiring is often not.</strong>
        </p>
        <p>
          A worker may live in one locality while the available opportunity is
          several kilometres away. A company may need hundreds of workers in a
          particular area but struggle to reach the right workforce quickly.
        </p>
        <p>GigKaro is built to solve this problem.</p>
        <p>
          We organize gig hiring around cities, localities and pincodes, helping
          businesses reach workers where they actually live.
        </p>
      </section>

      <section className="container section about-block">
        <h2>Built Around the Pincode</h2>
        <p>
          India&apos;s workforce is not concentrated only in major cities. Talent
          exists in every locality.
        </p>
        <p>
          That is why GigKaro is building a pincode-level hiring network. With
          coverage across 19,000+ Indian pincodes, our vision is to connect
          businesses with the local workforce required to keep their operations
          running.
        </p>
        <div className="about-trio">
          {localityLayers.map((item) => (
            <div key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <p className="about-emphasis">
          One city. One locality. One pincode at a time.
        </p>
      </section>

      <section className="container section about-block">
        <h2>More Than a Job Portal</h2>
        <p className="about-emphasis">
          We Are Built for Hiring Outcomes, Not Job Posts.
        </p>
        <p>
          Traditional job portals are primarily built around job postings,
          applications, subscriptions and access to candidate databases.
        </p>
        <p>GigKaro follows a fundamentally different model.</p>
        <div className="about-compare">
          <div>
            <h3>Traditional Job Portals</h3>
            <p>Companies may pay for:</p>
            <ul>
              <li>Job postings</li>
              <li>Featured or boosted jobs</li>
              <li>Candidate database access</li>
              <li>Recruiter subscriptions</li>
              <li>Candidate search</li>
              <li>Applications</li>
            </ul>
            <p>
              Their business model is largely connected to access, postings and
              candidate data.
            </p>
          </div>
          <div>
            <h3>GigKaro</h3>
            <p>
              GigKaro is built around successful hiring and joining. We don&apos;t
              build our business around selling job posts. We don&apos;t sell
              candidate databases. We don&apos;t sell access to candidate data.
            </p>
            <p>
              Our commercial model is tied to successful hiring outcomes. When a
              candidate successfully joins, that is the outcome that matters.
            </p>
            <p>This aligns our incentives with the hiring company.</p>
          </div>
        </div>
      </section>

      <section className="container section about-block">
        <h2>Applications Are Not the Outcome. Joinings Are.</h2>
        <p>
          A company can receive thousands of applications and still struggle to
          fill its workforce requirements.
        </p>
        <p>
          For frontline hiring, the real challenge is not simply generating
          applications. It is getting the right people to:
        </p>
        <p className="about-emphasis">
          Apply → Engage → Qualify → Get Selected → Join
        </p>
        <p>
          That&apos;s why GigKaro is designed around the complete hiring journey.
        </p>
        <div className="about-steps">
          {journey.map(([title, body]) => (
            <div key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <p>
          Applications are a step.
          <br />
          <strong>Joining is the outcome.</strong>
        </p>
      </section>

      <section className="container section about-block">
        <h2>Your Candidates. Your Data. Directly to You.</h2>
        <p>
          GigKaro is built with an API-first approach to hiring. When a worker
          applies for an opportunity, the relevant application and candidate
          information can flow directly to the hiring company&apos;s systems
          through API integrations.
        </p>
        <p>
          This reduces unnecessary manual data movement and enables a direct
          technology connection between GigKaro and the employer.
        </p>
        <p className="about-flow">
          Worker → GigKaro → API → Hiring Company
        </p>
        <p>
          The hiring company remains at the centre of the hiring process.
          GigKaro provides the distribution, technology and hiring execution
          layer that helps companies reach and convert frontline talent.
        </p>
      </section>

      <section className="container section about-block">
        <h2>No Manual Candidate Transfer</h2>
        <p>
          Traditional recruitment processes can involve multiple layers of
          downloading, forwarding, exporting and manually transferring candidate
          information. GigKaro is designed to minimize this friction through
          technology.
        </p>
        <p>Where an API integration is enabled:</p>
        <p className="about-flow">
          Candidate application → GigKaro → Employer&apos;s system
        </p>
        <p>
          This creates a more direct and scalable hiring workflow. Our goal is
          simple: get the right candidate information to the right hiring
          company, as directly as possible.
        </p>
      </section>

      <section className="container section about-block">
        <h2>We Don&apos;t Sell Candidate Data</h2>
        <p>
          GigKaro is not designed as a candidate-data marketplace. Our value
          comes from helping businesses hire, not from selling access to a
          database.
        </p>
        <p>
          We believe candidates should not simply become data points that can be
          repeatedly sold. Our focus is on creating a technology-enabled
          connection between:
        </p>
        <p className="about-emphasis">
          Worker ↔ Opportunity ↔ Hiring Company
        </p>
        <p>That is the foundation of our model.</p>
      </section>

      <section className="container section about-block">
        <h2>Built for High-Volume Frontline Hiring</h2>
        <p>
          GigKaro is designed for businesses that need to hire large numbers of
          workers across multiple locations. Our hiring categories include:
        </p>
        <div className="about-categories">
          {categories.map(([title, body]) => (
            <div key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <p>And other gig, blue-collar and frontline roles.</p>
      </section>

      <section className="container section about-block">
        <h2>Built for Businesses</h2>
        <p>
          Businesses don&apos;t simply need more resumes. They need people who
          can actually join and start working.
        </p>
        <p>GigKaro is designed for companies that require:</p>
        <ul className="about-list">
          {businessNeeds.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Whether a company needs workers in one locality or thousands across
          multiple cities, GigKaro is being built to support the hiring journey
          at scale.
        </p>
      </section>

      <section className="container section about-block">
        <h2>Built for Workers</h2>
        <p>
          GigKaro is also designed around the reality of frontline workers. Many
          workers don&apos;t have traditional resumes. Many don&apos;t spend
          their day browsing professional networks. Many simply want to know:
        </p>
        <p className="about-emphasis">What work is available near me?</p>
        <p>
          GigKaro makes it easier to discover opportunities based on:
        </p>
        <ul className="about-list">
          {workerDiscovery.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Our goal is to reduce unnecessary barriers between people and work.
          Less travel. Less friction. More local opportunities.
        </p>
      </section>

      <section className="container section about-block">
        <h2>Our Business Model</h2>
        <p>
          GigKaro follows a success-based hiring model. We believe our
          incentives should be aligned with the companies we serve.
        </p>
        <p>
          Instead of making the core business dependent on selling job posts or
          candidate-data access, our model is focused on successful hiring
          outcomes.
        </p>
        <p>
          Our success is measured by how many relevant candidates we help
          companies hire and how many successfully join.
        </p>
        <p>
          This creates a fundamentally different relationship between GigKaro
          and hiring companies. We don&apos;t just want to generate applications.
          We want to generate joinings.
        </p>
      </section>

      <section className="container section about-block">
        <h2>GigKaro vs Traditional Job Portals</h2>
        <div className="about-table" role="table" aria-label="GigKaro vs traditional job portals">
          <div className="about-table-head" role="row">
            <span role="columnheader">Traditional Job Portals</span>
            <span role="columnheader">GigKaro</span>
          </div>
          {comparison.map(([left, right]) => (
            <div className="about-table-row" role="row" key={left}>
              <span role="cell">{left}</span>
              <span role="cell">{right}</span>
            </div>
          ))}
        </div>
        <p>
          The difference is simple: job portals help companies find
          applications. GigKaro is built to help companies achieve joinings.
        </p>
      </section>

      <section className="container section about-block">
        <h2>Our Vision</h2>
        <p className="about-emphasis">
          Build the world&apos;s most accessible local hiring network for the
          frontline workforce.
        </p>
        <p>
          We believe the future of gig hiring will not be built only around
          cities. It will be built around localities, neighbourhoods and
          pincodes.
        </p>
        <p>
          Every pincode represents a potential workforce. Every business
          location represents a hiring requirement. GigKaro is building the
          network that connects the two.
        </p>
      </section>

      <section className="container section about-block">
        <h2>Our Mission</h2>
        <p className="about-emphasis">
          Make good work accessible closer to where people live, while helping
          businesses build frontline teams faster.
        </p>
        <p>We want to make the hiring journey:</p>
        <ul className="about-list">
          <li>More local.</li>
          <li>More direct.</li>
          <li>More technology-driven.</li>
          <li>More outcome-focused.</li>
        </ul>
      </section>

      <section className="container section about-block">
        <h2>Part of the EarlyJobs Ecosystem</h2>
        <p>
          GigKaro is proudly built by EarlyJobs. Our broader ecosystem brings
          together recruitment distribution, AI hiring technology and gig hiring
          execution.
        </p>
        <div className="about-trio">
          {ecosystemDetail.map((item) => (
            <div key={item.name}>
              <strong>{item.name}</strong>
              <p className="about-sublabel">{item.label}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <p className="about-emphasis">One Ecosystem. Multiple Hiring Needs.</p>
        <p>
          From professional recruitment to AI-powered hiring and frontline
          workforce execution, the EarlyJobs ecosystem is building
          infrastructure for the future of hiring.
        </p>
      </section>

      <section className="container section about-block">
        <h2>The Future of Gig Hiring Is Local</h2>
        <p>
          The next generation of workforce hiring will not be about putting more
          jobs on another job board. It will be about building direct,
          technology-enabled connections between businesses and the workforce
          around them.
        </p>
        <p>GigKaro is building that network.</p>
        <ul className="about-list">
          <li>19,000+ pincodes.</li>
          <li>Millions of potential workers.</li>
          <li>Thousands of businesses.</li>
          <li>One hiring network.</li>
        </ul>
      </section>

      <section className="container section about-cta">
        <h2>Join the GigKaro Network</h2>
        <div className="about-cta-grid">
          <div>
            <h3>For Businesses</h3>
            <p>Need to hire gig or frontline workers at scale?</p>
            <Link className="button button-primary" href="/contact">
              Start Hiring
              <ArrowRight size={16} />
            </Link>
          </div>
          <div>
            <h3>For Workers</h3>
            <p>Looking for work opportunities near you?</p>
            <Link className="button button-primary" href="/jobs">
              Find Jobs
              <ArrowRight size={16} />
            </Link>
          </div>
          <div>
            <h3>For Partners</h3>
            <p>Want to build the future of local hiring with us?</p>
            <Link className="button button-primary" href="/contact">
              Partner With Us
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="container section about-footer-note">
        <p className="about-brand">GigKaro</p>
        <p className="about-emphasis">Good Work. Closer to Home.</p>
        <p>A product of EarlyJobs</p>
        <p className="about-tags">
          Gig Hiring · Frontline Hiring · Hyperlocal Hiring · Pincode-Level
          Hiring
        </p>
      </section>
    </article>
  );
}
