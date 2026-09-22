"use client";
import { uiText } from "@/lib/i18n";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";
import type { Job } from "@/types";

export const applicationSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode."),
  bike: z.string().min(1, "Choose an answer."),
  licence: z.string().min(1, "Choose an answer."),
  joining: z.string().min(1, "Choose when you can join."),
});
type Values = z.infer<typeof applicationSchema>;

export const applicationQuestions = [
  { key: "bike", label: "Do you have a bike?", choices: ["Yes", "No"] },
  {
    key: "licence",
    label: "Do you have a driving licence?",
    choices: ["Yes", "No"],
  },
  {
    key: "joining",
    label: "When can you join?",
    choices: ["Immediately", "Within 7 Days", "Later"],
  },
] as const;

const APPLIED_KEY = "gigkaro-applied-jobs";

function readAppliedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function markAppliedLocally(jobId: string) {
  if (typeof window === "undefined") return;
  const ids = new Set(readAppliedIds());
  ids.add(jobId);
  localStorage.setItem(APPLIED_KEY, JSON.stringify([...ids]));
}

export function ApplyButton({
  job,
  sticky = false,
}: {
  job: Job;
  sticky?: boolean;
}) {
  const { user, ready } = useAuth();
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      mobile: "",
      pincode: job.pincode || "560034",
      bike: "",
      licence: "",
      joining: "",
    },
  });

  useEffect(() => {
    setApplied(readAppliedIds().includes(job.id));
  }, [job.id]);

  useEffect(() => {
    if (!ready || !user) return;
    form.reset({
      name: user.profile?.name || user.name || "",
      mobile: user.profile?.mobile || user.mobile || "",
      pincode: user.profile?.pincode || job.pincode || "560034",
      bike: "",
      licence: "",
      joining: "",
    });
    api<{ applications: { jobId: string }[] }>("/applications")
      .then((data) => {
        if (data.applications.some((a) => a.jobId === job.id)) {
          setApplied(true);
          markAppliedLocally(job.id);
        }
      })
      .catch(() => {});
  }, [ready, user, job.id, job.pincode]);

  async function next() {
    if (await form.trigger(["name", "mobile", "pincode"])) setStep(2);
  }

  async function submit(values: Values) {
    setSubmitError("");
    try {
      await api("/applications/public", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ ...values, jobId: job.id }),
      });
      markAppliedLocally(job.id);
      setApplied(true);
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        markAppliedLocally(job.id);
        setApplied(true);
        setStep(3);
        return;
      }
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Could not submit application.",
      );
    }
  }

  const status = (job as Job & { status?: string }).status;
  if (status && status !== "Active")
    return (
      <div className="notice">
        {uiText("thisJobIsCurrentlyUnavailable")}{" "}
        <Link className="text-link" href="/jobs">
          {uiText("findAnotherNearbyJob")}
        </Link>
      </div>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setStep(applied ? 3 : 1);
          setSubmitError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          className={`button button-primary ${sticky ? "" : "button-full"}`}
          type="button"
        >
          {applied ? "Applied" : "Apply Now"}
          <ArrowRight size={17} />
        </button>
      </DialogTrigger>
      <DialogContent className="application-dialog">
        <DialogTitle>
          {step === 3
            ? "Application submitted!"
            : applied
              ? "You\u2019re on the list."
              : step === 1
                ? "Your next opportunity starts here."
                : "A little about your work preferences."}
        </DialogTitle>
        <DialogDescription>
          {job.title} at {job.company} · {job.locality}
        </DialogDescription>
        {step === 3 || (applied && step !== 1 && step !== 2) ? (
          <div className="application-success">
            <CheckCircle2 size={64} />
            <h3>
              {step === 3 ? "You\u2019re all set!" : "Application received"}
            </h3>
            <p>
              We saved your details. The recruiter can contact you on the mobile
              number you shared.
            </p>
            <button
              type="button"
              className="button button-primary button-full"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
            <Link
              className="text-link"
              onClick={() => setOpen(false)}
              href={`/jobs?category=${job.category}&location=${job.pincode}`}
            >
              {uiText("viewSimilarJobs")}
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(submit)}>
            <div className="form-progress">
              <span className="active" />
              <span className={step === 2 ? "active" : ""} />
            </div>
            <p className="step-caption">
              {uiText("step")} {step} {uiText("of2")}{" "}
              {step === 1 ? "BASIC DETAILS" : "WORK PREFERENCES"}
            </p>
            {submitError && (
              <p className="field-error" role="alert">
                {submitError}
              </p>
            )}
            {step === 1 ? (
              <div className="stack">
                {(
                  [
                    {
                      key: "name",
                      label: "Your name",
                      placeholder: "Enter your full name",
                      type: "text",
                    },
                    {
                      key: "mobile",
                      label: "Mobile number",
                      placeholder: "10-digit mobile number",
                      type: "tel",
                    },
                    {
                      key: "pincode",
                      label: "Your pincode",
                      placeholder: "6-digit pincode",
                      type: "text",
                    },
                  ] as const
                ).map((f) => (
                  <div className="form-field" key={f.key}>
                    <label htmlFor={`apply-${f.key}`}>{f.label}</label>
                    <div className={f.key === "mobile" ? "phone-field" : ""}>
                      {f.key === "mobile" && <span>+91</span>}
                      <input
                        id={`apply-${f.key}`}
                        type={f.type}
                        inputMode={f.key === "name" ? "text" : "numeric"}
                        maxLength={
                          f.key === "mobile" ? 10 : f.key === "pincode" ? 6 : 80
                        }
                        placeholder={f.placeholder}
                        {...form.register(f.key)}
                      />
                    </div>
                    {form.formState.errors[f.key] && (
                      <p role="alert" className="field-error">
                        {form.formState.errors[f.key]?.message}
                      </p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="button button-primary button-full"
                  onClick={next}
                >
                  {uiText("continue")}
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <div className="stack">
                {applicationQuestions.map((q) => (
                  <fieldset className="question-field" key={q.key}>
                    <legend>{q.label}</legend>
                    <div className="choice-row">
                      {q.choices.map((choice) => (
                        <label
                          key={choice}
                          className={
                            form.watch(q.key) === choice
                              ? "choice selected"
                              : "choice"
                          }
                        >
                          <input
                            type="radio"
                            {...form.register(q.key)}
                            value={choice}
                          />
                          {choice}
                        </label>
                      ))}
                    </div>
                    {form.formState.errors[q.key] && (
                      <p className="field-error" role="alert">
                        {form.formState.errors[q.key]?.message}
                      </p>
                    )}
                  </fieldset>
                ))}
                <div className="row">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft size={16} />
                    {uiText("back")}
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={form.formState.isSubmitting}
                  >
                    {uiText("submitApplication")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
            <p className="privacy-note">
              <ShieldCheck size={15} />
              No sign-in needed. We only use the details you enter to process
              this application.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
