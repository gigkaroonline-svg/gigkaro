import { uiText } from "@/lib/i18n";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Users,
  SlidersHorizontal,
  Zap,
  FileCheck2,
  Check,
  Building2,
} from "lucide-react";
import { SectionHeading } from "@/components/primitives";
export function HirePage() {
  return (
    <>
      <section className="hire-hero">
        <div className="container hire-grid">
          <div>
            <div className="eyebrow">{uiText("localTalentLessWaiting")}</div>
            <h1>
              {uiText("hireGigWorkers")}
              <br />
              <span>{uiText("nearYourBusiness")}</span>
            </h1>
            <p>
              {uiText("deliveryPartnersWarehouseTeamsAndFieldExecutives")}
              <br />
              {uiText("findThePeopleYouNeedRightWhereYouNeedThem")}
            </p>
            <div className="banner-actions">
              <Link
                className="button button-primary"
                href="/login?role=employer"
              >
                {uiText("employerLogin")}
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hire-points">
              <span>
                <Check size={15} />
                {uiText("pincodeLevelHiring")}
              </span>
              <span>
                <Check size={15} />
                {uiText("builtForGigTeams")}
              </span>
            </div>
          </div>
          <div className="hiring-preview">
            <div className="row spread">
              <span className="icon-tile blue">
                <Building2 />
              </span>
              <span className="badge badge-blue">
                {uiText("yourHiringSimplified")}
              </span>
            </div>
            <h3>{uiText("buildYourNeighbourhoodTeam")}</h3>
            <div className="hiring-summary">
              <span>
                <strong>01</strong>
                {uiText("tellUsWhoYouNeed")}
              </span>
              <span>
                <strong>02</strong>
                {uiText("chooseYourLocation")}
              </span>
              <span>
                <strong>03</strong>
                {uiText("connectWithLocalApplicants")}
              </span>
            </div>
            <div className="notice">
              <MapPin size={15} /> {uiText("onePincodeMorePossibilities")}
            </div>
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          title="Made for the way gig hiring works."
          description="Simple tools for busy teams, from one opening to your next big hiring drive."
        />
        <div className="benefit-grid">
          {[
            [
              MapPin,
              "Pincode-level targeting",
              "Reach candidates who live near the job.",
            ],
            [Users, "Bulk hiring", "Manage multiple openings in one place."],
            [
              SlidersHorizontal,
              "Faster screening",
              "See work preferences before you call.",
            ],
            [
              Zap,
              "Gig-specific talent",
              "Find people ready for practical, local work.",
            ],
            [
              FileCheck2,
              "Candidate tracking",
              "Follow applications from first contact to joining.",
            ],
            [
              Building2,
              "One clear workspace",
              "Keep jobs, applicants and team details together.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof MapPin;
            return (
              <div key={String(title)}>
                <I />
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="container employer-banner">
        <div>
          <div className="eyebrow">{uiText("startWithYourNextOpening")}</div>
          <h2>{uiText("yourNextGreatHireCouldBeAroundTheCorner")}</h2>
          <p>{uiText("tellUsTheRoleLocationAndEarningsWeLlTake")}</p>
        </div>
        <Link className="button button-primary" href="/login?role=employer">
          {uiText("employerLogin")}
          <ArrowRight size={17} />
        </Link>
      </section>
      <section className="container section faq-section">
        <SectionHeading title="A few things worth knowing" />
        {[
          [
            "How does pincode-level hiring work?",
            "Choose the work location and your hiring radius. The frontend shows how local matching and applicant management will work.",
          ],
          [
            "Can I hire multiple workers?",
            "Yes. Specify the number of openings for each role, and track each applicant through a simple hiring pipeline.",
          ],
          [
            "Are jobs published immediately?",
            "New requirements enter Pending approval. An admin reviews the role before it becomes active.",
          ],
          [
            "Is this connected to real candidates?",
            "No. This preview uses fictional listings and candidates. All changes are saved only in this browser.",
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
