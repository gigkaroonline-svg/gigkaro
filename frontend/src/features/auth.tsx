"use client";
import { uiText } from "@/lib/i18n";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Phone,
  Mail,
  ShieldCheck,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDemoStore } from "@/hooks/use-demo-store";
import { ApiError } from "@/lib/api";
import { z } from "zod";
export function AuthPage({
  mode = "login",
}: {
  mode?: "login" | "register" | "otp";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role");
  const role =
    roleParam === "employer"
      ? "employer"
      : roleParam === "admin"
        ? "admin"
        : "candidate";
  const { requestOtp, verifyOtp } = useAuth();
  const { toast } = useDemoStore();
  const [emailMode, setEmailMode] = useState(false);
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "otp") {
      let context: { value?: string; email?: boolean; role?: string } = {};
      try {
        context = JSON.parse(sessionStorage.getItem("gigkaro-auth") || "{}");
      } catch {}
      if (!context.value) {
        setError("Start with your mobile number or email first.");
        return;
      }
      const nextRole =
        context.role === "employer"
          ? "employer"
          : context.role === "admin"
            ? "admin"
            : "candidate";
      setPending(true);
      try {
        await verifyOtp({
          otp,
          role: nextRole,
          ...(context.email
            ? { email: context.value }
            : { mobile: context.value }),
        });
        router.push(
          nextRole === "employer"
            ? "/employer"
            : nextRole === "admin"
              ? "/admin"
              : "/candidate",
        );
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not verify OTP. Try again.",
        );
      } finally {
        setPending(false);
      }
      return;
    }
    const schema = emailMode
      ? z.string().email()
      : z.string().regex(/^[6-9]\d{9}$/);
    if (!schema.safeParse(value).success) {
      setError(
        emailMode
          ? "Enter a valid email address."
          : "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }
    setPending(true);
    try {
      await requestOtp({
        role,
        ...(emailMode ? { email: value } : { mobile: value }),
      });
      sessionStorage.setItem(
        "gigkaro-auth",
        JSON.stringify({ value, email: emailMode, role }),
      );
      router.push(`/verify-otp?role=${role}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not request OTP. Is the API running?",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="container auth-layout">
      <div className="auth-story">
        <div className="eyebrow">{uiText("kaamKaroKamao2")}</div>
        <h1>
          {role === "employer"
            ? "Great teams start close to home."
            : role === "admin"
              ? "Keep the network healthy."
              : "Your next chapter starts nearby."}
        </h1>
        <p>
          {role === "employer"
            ? "Reach local workers, manage applications and build a team in your neighbourhood."
            : role === "admin"
              ? "Review jobs, applications and directory health across GigKaro."
              : "Discover work that fits your life. Save your favourites, apply in minutes and follow your progress."}
        </p>
        <div className="auth-benefits">
          <div>
            <MapPin />
            {uiText("workInYourNeighbourhood")}
          </div>
          <div>
            <ShieldCheck />
            {uiText("clearEarningsSimpleApplications")}
          </div>
        </div>
        <div className="auth-quote">
          {uiText("lessTravel")}
          <br />
          <span>{uiText("morePossibilities")}</span>
        </div>
      </div>
      <section className="auth-card panel">
        <div className="icon-tile blue">{emailMode ? <Mail /> : <Phone />}</div>
        <h2>
          {mode === "otp"
            ? "Enter your demo code"
            : mode === "register"
              ? "Let’s get you started."
              : role === "employer"
                ? "Welcome, employer."
                : role === "admin"
                  ? "Welcome, admin."
                  : "Welcome to GigKaro."}
        </h2>
        <p>
          {mode === "otp"
            ? "Use 123456 to explore the account experience. No SMS or email is sent."
            : role === "employer"
              ? "Hire great workers near you."
              : role === "admin"
                ? "Use an allowlisted admin mobile or email."
                : "Find work near you."}
        </p>
        <form onSubmit={submit} className="stack">
          <div className="form-field">
            <label htmlFor="auth-value">
              {mode === "otp"
                ? "6-digit demo code"
                : emailMode
                  ? "Email address"
                  : "Mobile number"}
            </label>
            {mode === "otp" ? (
              <input
                id="auth-value"
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder={uiText("123456")}
              />
            ) : (
              <div className={!emailMode ? "phone-field" : ""}>
                {!emailMode && <span>+91</span>}
                <input
                  id="auth-value"
                  type={emailMode ? "email" : "tel"}
                  inputMode={emailMode ? "email" : "numeric"}
                  autoComplete={emailMode ? "email" : "tel-national"}
                  placeholder={
                    emailMode
                      ? "you@example.com"
                      : "Enter 10-digit mobile number"
                  }
                  maxLength={emailMode ? 100 : 10}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <button
            className="button button-primary button-full"
            disabled={pending}
          >
            {pending
              ? "Please wait…"
              : mode === "otp"
                ? "Verify & Continue"
                : "Continue"}
            <ArrowRight size={17} />
          </button>
        </form>
        {mode === "otp" ? (
          <div className="auth-secondary">
            <button
              className="text-link"
              type="button"
              onClick={() =>
                toast("Your demo code is 123456. No message was sent.")
              }
            >
              {uiText("resendDemoCode")}
            </button>
            <Link href={`/login?role=${role}`} className="text-link">
              {uiText("changeMobileEmail")}
            </Link>
          </div>
        ) : (
          <>
            <div className="or-divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="button button-outline button-full"
              onClick={() => {
                setEmailMode((v) => !v);
                setValue("");
                setError("");
              }}
            >
              {emailMode ? <Phone size={17} /> : <Mail size={17} />}
              {uiText("continueWith")} {emailMode ? "Mobile" : "Email"}
            </button>
            <p className="auth-terms">
              {uiText("byContinuingYouCanExploreTheDemoReadOur")}{" "}
              <Link href="/terms">{uiText("terms2")}</Link> {uiText("and")}{" "}
              <Link href="/privacy">{uiText("privacyNotice")}</Link>.
            </p>
          </>
        )}
        <div className="notice">
          {uiText("demoAccessOnlyUseSampleDetailsYourInformationStaysIn")}
        </div>
        <Link className="text-link" href="/jobs">
          <ArrowLeft size={15} />
          {uiText("keepBrowsingJobs")}
        </Link>
      </section>
    </div>
  );
}
