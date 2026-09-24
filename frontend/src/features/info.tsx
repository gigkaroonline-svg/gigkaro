"use client";
import { uiText } from "@/lib/i18n";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Breadcrumb } from "@/components/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
const copy: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  about: {
    title: "Good work. Closer to home.",
    intro:
      "GigKaro is a pincode-first way to discover gig work and build local teams.",
    sections: [
      [
        "Kaam Karo. Kamao.",
        "Our product starts with a simple idea: where you live should help you find where you work. Explore delivery, warehouse, logistics, EV and field opportunities with clear earnings and straightforward applications.",
      ],
      [
        "Designed around your day",
        "Choose a neighbourhood, find work that fits and apply with your basic details. Employers can target local areas and follow candidates through a clear hiring process.",
      ],
      [
        "About this preview",
        "This is a frontend demonstration. All employers, jobs and hiring activity are fictional. Nothing here represents an offer of employment.",
      ],
    ],
  },
  privacy: {
    title: "Your privacy in this demo.",
    intro: "A clear look at what this frontend stores and how it works.",
    sections: [
      [
        "What stays on your device",
        "Saved jobs, demo applications, profile details and employer requirements are stored in this browser’s local storage. Login context is held in session storage. This demo does not send applications, SMS messages or emails.",
      ],
      [
        "Use sample details",
        "Please use fictional contact information when exploring forms. Do not enter Aadhaar, PAN, licence numbers or other sensitive documents. Document upload is intentionally unavailable in this preview.",
      ],
      [
        "Location permission",
        "Location is requested only when you tap “Use my current location”. Coordinates are used in your browser to find a nearby demo area; they are not saved by this application.",
      ],
      [
        "Future live service",
        "A production privacy policy, retention settings, consent controls and secure backend must be reviewed before this product processes real users’ personal information.",
      ],
    ],
  },
  terms: {
    title: "About using this preview.",
    intro:
      "GigKaro is currently a frontend demonstration, with fictional jobs and companies.",
    sections: [
      [
        "Demo opportunities",
        "Listings do not represent actual vacancies or guaranteed earnings. The application and hiring flows simulate the intended product experience.",
      ],
      [
        "No charges or commitments",
        "This preview does not collect payment, create employment agreements or submit details to a recruiter. Browse and test the experience using sample information.",
      ],
      [
        "Before a live launch",
        "Production terms, employer verification standards and candidate protections must be finalized before real hiring begins.",
      ],
    ],
  },
  cookies: {
    title: "A simple storage notice.",
    intro: "This demo uses browser storage to keep your experience consistent.",
    sections: [
      [
        "Local storage",
        "Your saved jobs, applications, profile, posted jobs and demo settings remain on this device between visits. You can clear this information using your browser’s site-data controls.",
      ],
      [
        "Session storage",
        "Temporary login context is kept for the current browser session. No real authentication tokens are issued.",
      ],
      [
        "Analytics",
        "This frontend does not include advertising trackers or an analytics integration. The preview hosting service may manage its own access session.",
      ],
    ],
  },
};
export function InfoPage({ kind }: { kind: string }) {
  const [sent, setSent] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    setSending(true);
    setError("");
    try {
      await api("/contact", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ name, email, message }),
      });
      setSent({ name, email });
      form.reset();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not send your message. Try again.",
      );
    } finally {
      setSending(false);
    }
  }

  if (kind === "contact")
    return (
      <div className="container section info-page">
        <Breadcrumb items={[{ label: "Contact" }]} />
        <div className="eyebrow">{uiText("letSMakeLocalWorkBetter")}</div>
        <h1>{uiText("aLittleFeedbackGoesALongWay")}</h1>
        <p>
          {uiText("thisDemoFeedbackFormShowsTheIntendedContactExperienceIt")}
        </p>
        <form
          className="panel stack"
          style={{ marginTop: 30 }}
          onSubmit={submitContact}
        >
          <div className="form-field">
            <label htmlFor="contact-name">{uiText("yourName")}</label>
            <input
              id="contact-name"
              name="name"
              required
              minLength={2}
              placeholder={uiText("sampleName")}
            />
          </div>
          <div className="form-field">
            <label htmlFor="contact-email">{uiText("email")}</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              placeholder={uiText("youExampleCom")}
            />
          </div>
          <div className="form-field">
            <label htmlFor="contact-message">
              {uiText("whatWouldYouLikeToShare")}
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
            />
          </div>
          <button className="button button-primary" disabled={sending}>
            {sending ? "Sending…" : uiText("previewFeedbackSubmission")}
            <ArrowRight size={16} />
          </button>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </form>
        <Dialog open={Boolean(sent)} onOpenChange={(open) => !open && setSent(null)}>
          <DialogContent className="contact-sent-dialog" showCloseButton={false}>
            <CheckCircle2 size={36} aria-hidden />
            <DialogTitle>Thanks{sent?.name ? `, ${sent.name}` : ""}</DialogTitle>
            <DialogDescription>Your message has been submitted.</DialogDescription>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setSent(null)}
            >
              Done
            </button>
          </DialogContent>
        </Dialog>
      </div>
    );
  const c = copy[kind] || copy.about;
  return (
    <section className="container section info-page">
      <Breadcrumb
        items={[{ label: kind.charAt(0).toUpperCase() + kind.slice(1) }]}
      />
      <div className="eyebrow">{uiText("gigkaroKaamKaroKamao")}</div>
      <h1>{c.title}</h1>
      <p className="info-intro">{c.intro}</p>
      {c.sections.map(([title, body]) => (
        <div className="info-section" key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
      ))}
      <Link className="button button-primary" href="/jobs">
        {uiText("exploreNearbyJobs")}
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}
