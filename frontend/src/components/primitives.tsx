import { uiText } from "@/lib/i18n";
import Link from "next/link";
import {
  SearchX,
  ArrowRight,
  BadgeCheck,
  MapPin,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}
export function VerifiedEmployerBadge() {
  return (
    <Badge tone="green">
      <BadgeCheck size={13} />
      {uiText("verified")}
    </Badge>
  );
}
export function ImmediateJoiningBadge() {
  return (
    <Badge tone="amber">
      <Zap size={12} />
      {uiText("immediateJoining")}
    </Badge>
  );
}
export function DistanceBadge({ distance }: { distance: number }) {
  return (
    <span className="inline-meta">
      <MapPin size={14} />
      {distance} {uiText("kmAway")}
    </span>
  );
}
export function SalaryBadge({ min, max }: { min: number; max: number }) {
  return (
    <span className="salary">
      ₹{min.toLocaleString("en-IN")}–{max.toLocaleString("en-IN")}{" "}
      <small>{uiText("month")}</small>
    </span>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label={uiText("breadcrumb")} className="breadcrumb">
      <Link href="/">{uiText("home")}</Link>
      {items.map((item, i) => (
        <span key={i}>
          <ChevronRight size={13} />
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </nav>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="icon-tile blue">
        <SearchX />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {action || "View all"}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function DashboardStatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
export function DemandScoreBadge({ score }: { score: number }) {
  return (
    <Badge tone={score >= 75 ? "green" : score >= 50 ? "amber" : "neutral"}>
      {score} · {score >= 75 ? "High" : score >= 50 ? "Medium" : "Low"}
    </Badge>
  );
}
