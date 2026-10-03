import { API_URL } from "@/lib/api";

const VISITOR_KEY = "gigkaro-vid";
const SESSION_KEY = "gigkaro-sid";
const SESSION_TS_KEY = "gigkaro-sid-ts";
const ATTRIBUTION_KEY = "gigkaro-attr";
const SESSION_MS = 30 * 60 * 1000;

type Attribution = {
  referrer: string;
  source: string;
  medium: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
};

type AnalyticsPayload = {
  type: "pageview" | "event";
  name?: string;
  path: string;
  title?: string;
  props?: Record<string, unknown>;
  userId?: string;
};

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function readId(key: string) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeId(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function getVisitorId() {
  let id = readId(VISITOR_KEY);
  if (!id) {
    id = randomId();
    writeId(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId() {
  const now = Date.now();
  try {
    const existing = localStorage.getItem(SESSION_KEY) || "";
    const ts = Number(localStorage.getItem(SESSION_TS_KEY) || 0);
    if (existing && now - ts < SESSION_MS) {
      localStorage.setItem(SESSION_TS_KEY, String(now));
      return existing;
    }
  } catch {
    // fall through
  }
  const id = randomId();
  writeId(SESSION_KEY, id);
  writeId(SESSION_TS_KEY, String(now));
  return id;
}

function hostFromReferrer(referrer: string) {
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function captureAttribution(): Attribution {
  if (typeof window === "undefined") {
    return {
      referrer: "",
      source: "direct",
      medium: "none",
      campaign: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") || "";
  const utmMedium = params.get("utm_medium") || "";
  const utmCampaign = params.get("utm_campaign") || "";
  const utmContent = params.get("utm_content") || "";
  const utmTerm = params.get("utm_term") || "";
  const referrer = document.referrer || "";
  const refHost = hostFromReferrer(referrer);
  const sameSite =
    !!refHost &&
    (refHost === window.location.hostname.replace(/^www\./, "") ||
      refHost.endsWith(".gigkaro.in"));

  let source = "direct";
  let medium = "none";
  if (utmSource) {
    source = utmSource;
    medium = utmMedium || "campaign";
  } else if (referrer && !sameSite) {
    if (refHost.includes("google.")) {
      source = "google";
      medium = "organic";
    } else if (refHost.includes("bing.")) {
      source = "bing";
      medium = "organic";
    } else if (
      refHost.includes("facebook.") ||
      refHost.includes("instagram.") ||
      refHost.includes("whatsapp.")
    ) {
      source = refHost;
      medium = "social";
    } else {
      source = refHost || "referral";
      medium = "referral";
    }
  }

  const next: Attribution = {
    referrer: sameSite ? "" : referrer,
    source,
    medium,
    campaign: utmCampaign,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
  };

  // Keep first-touch attribution for the session when landing with UTM/referrer.
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (raw && !utmSource && sameSite) {
      return JSON.parse(raw) as Attribution;
    }
    if (utmSource || (referrer && !sameSite)) {
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
    } else if (raw) {
      return JSON.parse(raw) as Attribution;
    }
  } catch {
    // ignore
  }
  return next;
}

async function send(events: Record<string, unknown>[]) {
  if (typeof window === "undefined" || !events.length) return;
  const body = JSON.stringify({ events });
  const url = `${API_URL}/analytics/collect`;
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    });
  } catch {
    // never block UX on analytics
  }
}

function baseFields(extra: AnalyticsPayload) {
  const attr = captureAttribution();
  return {
    type: extra.type,
    name: extra.name || "",
    path: extra.path,
    title: extra.title || (typeof document !== "undefined" ? document.title : ""),
    referrer: attr.referrer,
    source: attr.source,
    medium: attr.medium,
    campaign: attr.campaign,
    utmSource: attr.utmSource,
    utmMedium: attr.utmMedium,
    utmCampaign: attr.utmCampaign,
    utmContent: attr.utmContent,
    utmTerm: attr.utmTerm,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    userId: extra.userId || "",
    language:
      typeof navigator !== "undefined" ? navigator.language || "" : "",
    screen:
      typeof window !== "undefined"
        ? `${window.screen?.width || 0}x${window.screen?.height || 0}`
        : "",
    props: extra.props || {},
  };
}

export function trackPageview(path?: string, userId?: string) {
  if (typeof window === "undefined") return;
  const pagePath =
    path || `${window.location.pathname}${window.location.search}`;
  void send([
    baseFields({
      type: "pageview",
      path: pagePath,
      title: document.title,
      userId,
    }),
  ]);
}

export function trackEvent(
  name: string,
  props: Record<string, unknown> = {},
  path?: string,
  userId?: string,
) {
  if (typeof window === "undefined") return;
  const pagePath =
    path || `${window.location.pathname}${window.location.search}`;
  void send([
    baseFields({
      type: "event",
      name,
      path: pagePath,
      title: document.title,
      props,
      userId,
    }),
  ]);
}
