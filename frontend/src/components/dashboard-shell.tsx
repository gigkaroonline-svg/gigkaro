"use client";
import { uiText } from "@/lib/i18n";

import Link from "next/link";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileCheck2,
  Building2,
  Wallet,
  Settings,
  Layers,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

const employerNav = [
  ["overview", "Overview", LayoutDashboard],
  ["jobs", "Jobs", BriefcaseBusiness],
  ["applications", "Applications", FileCheck2],
  ["candidates", "Candidates", Users],
  ["company", "Company", Building2],
  ["billing", "Billing", Wallet],
  ["settings", "Settings", Settings],
] as const;

const adminNav = [
  ["overview", "Dashboard", LayoutDashboard],
  ["jobs", "Jobs", BriefcaseBusiness],
  ["applications", "Applications", FileCheck2],
  ["candidates", "Candidates", Users],
  ["companies", "Companies", Building2],
  ["categories", "Categories", Layers],
] as const;

export function DashboardShell({
  role,
  view,
  children,
}: {
  role: "employer" | "admin";
  view: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const nav = role === "employer" ? employerNav : adminNav;
  const showAdminLink = role === "employer" && user?.role === "admin";

  return (
    <div className="dashboard-background">
      <div className="container dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="workspace-brand">
            <span
              className={`company-avatar ${role === "employer" ? "blue" : "slate"}`}
            >
              {role === "employer" ? "sb" : <ShieldCheck />}
            </span>
            <div>
              <strong>
                {role === "employer" ? "SwiftBox" : "GigKaro Admin"}
              </strong>
              <small>
                {role === "employer"
                  ? "Employer workspace"
                  : "Platform workspace"}
              </small>
            </div>
          </div>
          <nav>
            {nav.map(([key, label, Icon]) => (
              <Link
                key={key}
                className={key === view ? "active" : ""}
                href={key === "overview" ? `/${role}` : `/${role}/${key}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="dashboard-sidebar-bottom">
            {role === "employer" ? (
              <>
                <span className="badge badge-blue">{uiText("demoWorkspace")}</span>
                <p>{uiText("fictionalDataChangesStayInThisBrowser")}</p>
                {showAdminLink && (
                  <Link className="text-link" href="/admin">
                    Open admin
                  </Link>
                )}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => logout()}
                >
                  <LogOut size={14} /> {uiText("signOut")}
                </button>
              </>
            ) : (
              <>
                <span className="badge badge-blue">Admin API</span>
                <p>Moderation and pipelines are stored in MongoDB.</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => logout()}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </>
            )}
          </div>
        </aside>
        <section className="dashboard-main">
          <div className="dashboard-heading">
            <div>
              <div className="eyebrow">
                {role === "employer"
                  ? "BUILD A STRONGER LOCAL TEAM"
                  : "PLATFORM CONTROL"}
              </div>
              <h1>
                {view === "overview"
                  ? role === "employer"
                    ? "Your hiring, at a glance."
                    : "Your network, at a glance."
                  : nav.find((v) => v[0] === view)?.[1] || "Job details"}
              </h1>
              <p>
                {role === "employer"
                  ? "Good people. Clear progress. All in one place."
                  : "Review jobs, applications and directory health."}
              </p>
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
