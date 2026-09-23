"use client";
import { uiText } from "@/lib/i18n";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  MapPin,
  BriefcaseBusiness,
  Home,
  Bookmark,
  UserRound,
  FileCheck2,
  ArrowRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
export function GigKaroLogo() {
  return (
    <Link href="/" className="logo" aria-label={uiText("gigkaroHome")}>
      {uiText("gigkaro")}
      <span className="logo-dot">.</span>
      <span className="logo-in">in</span>
    </Link>
  );
}
const links = [
  ["Find Jobs", "/jobs"],
  ["Categories", "/categories"],
  ["Locations", "/locations"],
];
export function MainHeader() {
  const path = usePathname();
  return (
    <header className="main-header">
      <div className="container header-inner">
        <GigKaroLogo />
        <nav aria-label={uiText("mainNavigation")} className="desktop-nav">
          {links.map(([label, href]) => (
            <Link
              className={path === href ? "active" : ""}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mobile-menu"
                aria-label={uiText("openMenu")}
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{uiText("gigkaro")}</SheetTitle>
              </SheetHeader>
              <nav className="sheet-nav">
                {links.map(([label, href]) => (
                  <SheetClose asChild key={href}>
                    <Link href={href}>
                      {label}
                      <ArrowRight size={16} />
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <GigKaroLogo />
            <p>{uiText("goodWorkCloserToHome")}</p>
            <span>{uiText("indiaSPincodeLevelGigHiringNetwork")}</span>
            <div className="footer-tagline">{uiText("kaamKaroKamao")}</div>
            <div className="footer-contact">
              <a
                className="footer-linkedin"
                href="https://www.linkedin.com/company/gigkaro"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GigKaro on LinkedIn"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.23 0z"
                  />
                </svg>
              </a>
              <a
                className="footer-instagram"
                href="https://www.instagram.com/gigkaro"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GigKaro on Instagram"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"
                  />
                </svg>
              </a>
              <a
                className="footer-whatsapp"
                href="https://wa.me/919180379173"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20.52 3.48A11.8 11.8 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L0 24l6.3-1.65a11.86 11.86 0 0 0 5.76 1.47h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.44-8.44zM12.07 21.5h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.74.98 1-3.64-.23-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 7 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.87-9.94 9.87zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"
                  />
                </svg>
              </a>
              <a className="footer-phone" href="tel:+919180379173">
                91803 79173
              </a>
            </div>
          </div>
          {[
            [
              "GigKaro",
              ["About", "/about"],
              ["How it works", "/#how-it-works"],
              ["Contact", "/contact"],
            ],
            [
              "Find work",
              ["Delivery jobs", "/delivery-jobs/bengaluru"],
              ["Warehouse jobs", "/warehouse-jobs/bengaluru"],
              ["EV rider jobs", "/jobs?category=ev"],
              ["Field jobs", "/jobs?category=field"],
            ],
            [
              "Popular locations",
              ["Bengaluru", "/jobs?location=Bengaluru"],
              ["Delhi NCR", "/jobs?location=Delhi"],
              ["Mumbai", "/jobs?location=Mumbai"],
              ["Hyderabad", "/jobs?location=Hyderabad"],
            ],
          ].map(([heading, ...items]) => (
            <div key={String(heading)}>
              <h3>{heading as string}</h3>
              {(items as string[][]).map(([label, href]) => (
                <Link key={label} href={href}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>{uiText("2026GigkaroAllRightsReserved")}</span>
          <div>
            <Link href="/privacy">{uiText("privacy")}</Link>
            <Link href="/terms">{uiText("terms")}</Link>
            <Link href="/cookies">{uiText("cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export function MobileNav() {
  const path = usePathname();
  if (!path.startsWith("/candidate")) return null;
  return (
    <nav className="bottom-nav" aria-label={uiText("candidateNavigation")}>
      {[
        [Home, "Home", "/candidate"],
        [BriefcaseBusiness, "Jobs", "/jobs"],
        [FileCheck2, "Applications", "/candidate/applications"],
        [Bookmark, "Saved", "/candidate/saved"],
        [UserRound, "Profile", "/candidate/profile"],
      ].map(([Icon, label, href]) => {
        const I = Icon as typeof MapPin;
        return (
          <Link
            key={String(href)}
            className={path === href ? "active" : ""}
            href={href as string}
          >
            <I size={20} />
            <span>{label as string}</span>
          </Link>
        );
      })}
    </nav>
  );
}
