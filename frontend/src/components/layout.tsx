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
          <span>{uiText("madeForAWorkingIndia")}</span>
        </div>
        <p className="demo-note">
          {uiText(
            "demoExperienceAllEmployersOpportunitiesAndHiringFiguresAreFictional",
          )}
        </p>
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
