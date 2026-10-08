"use client";
import { Fragment, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Breadcrumb } from "@/components/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { uiText } from "@/lib/i18n";
import { contactFaqs } from "@/lib/metadata";
const copy: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  privacy: {
    title: "Your privacy.",
    intro: "A clear look at what this frontend stores and how it works.",
    sections: [
      [
        "What stays on your device",
        "Saved jobs, applications, profile details and employer requirements are stored in this browser’s local storage. Login context is held in session storage.",
      ],
      [
        "Use sample details",
        "Please use fictional contact information when exploring forms. Do not enter Aadhaar, PAN, licence numbers or other sensitive documents. Document upload is intentionally unavailable in this preview.",
      ],
      [
        "Location permission",
        "Location is requested only when you tap “Use my current location”. Coordinates are used in your browser to find a nearby area; they are not saved by this application.",
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
      "GigKaro connects people with gig and frontline jobs and helps employers hire locally.",
    sections: [
      [
        "Opportunities",
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
    intro: "This site uses browser storage to keep your experience consistent.",
    sections: [
      [
        "Local storage",
        "Your saved jobs, applications, profile, posted jobs and settings remain on this device between visits. You can clear this information using your browser’s site-data controls.",
      ],
      [
        "Session storage",
        "Temporary login context is kept for the current browser session. No real authentication tokens are issued.",
      ],
      [
        "Analytics",
        "We use Google Analytics and first-party analytics on our servers to understand visits, traffic sources, and key actions such as applications. We do not sell this data.",
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
        <section className="section faq-section" style={{ marginTop: 48 }}>
          <h2>Frequently Asked Questions</h2>
          {contactFaqs.map((item) => (
            <Fragment key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </Fragment>
          ))}
        </section>
      </div>
    );
  const c = copy[kind] || copy.privacy;
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
