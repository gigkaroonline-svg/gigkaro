"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { trackPageview } from "@/lib/first-party-analytics";

export function FirstPartyAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const lastKey = useRef("");

  useEffect(() => {
    const search = searchParams?.toString();
    const path = `${pathname || "/"}${search ? `?${search}` : ""}`;
    // Keep admin/dashboard browsing out of public traffic analytics.
    if (
      path.startsWith("/admin") ||
      path.startsWith("/candidate") ||
      path.startsWith("/employer") ||
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/verify-otp")
    ) {
      return;
    }
    const key = `${path}|${user?.id || ""}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    trackPageview(path, user?.id);
  }, [pathname, searchParams, user?.id]);

  return null;
}
