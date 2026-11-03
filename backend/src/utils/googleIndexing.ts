import { createSign } from "node:crypto";
import { env } from "../config/env.js";
import { slugWithoutPincode } from "./jobs.js";

type IndexingType = "URL_UPDATED" | "URL_DELETED";

export type IndexingResult = {
  ok: boolean;
  status: number;
  url: string;
  error?: string;
  skipped?: boolean;
};

function siteOrigin() {
  return (env.publicSiteOrigin || "https://www.gigkaro.in").replace(/\/$/, "");
}

function isLocalOrigin(origin: string) {
  return /localhost|127\.0\.0\.1/i.test(origin);
}

function jobPublicUrl(slug: string) {
  return `${siteOrigin()}/job/${encodeURIComponent(slug)}/`;
}

export function canonicalJobSlug(slug: string, showEverywhere?: boolean) {
  return showEverywhere ? slugWithoutPincode(slug) : slug;
}

async function googleAccessToken() {
  const email = env.googleIndexingClientEmail || env.gcsClientEmail;
  const key = env.googleIndexingPrivateKey || env.gcsPrivateKey;
  if (!email || !key) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(key, "base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string };
  return data.access_token || null;
}

export async function notifyGoogleJobUrl(
  slug: string,
  type: IndexingType = "URL_UPDATED",
  options?: { showEverywhere?: boolean },
): Promise<IndexingResult> {
  const canonical = canonicalJobSlug(slug, options?.showEverywhere);
  const url = jobPublicUrl(canonical);
  if (!env.googleIndexingEnabled) {
    return { ok: true, status: 0, url, skipped: true };
  }
  if (isLocalOrigin(siteOrigin())) {
    return {
      ok: false,
      status: 0,
      url,
      error: "PUBLIC_SITE_ORIGIN must be the public production host",
    };
  }
  if (!canonical) {
    return { ok: false, status: 0, url, error: "Missing slug" };
  }
  try {
    const token = await googleAccessToken();
    if (!token) {
      return { ok: false, status: 0, url, error: "Missing Google auth token" };
    }
    const response = await fetch(
      "https://indexing.googleapis.com/v3/urlNotifications:publish",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, type }),
      },
    );
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false,
        status: response.status,
        url,
        error: body.slice(0, 300) || `HTTP ${response.status}`,
      };
    }
    return { ok: true, status: response.status, url };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      url,
      error: err instanceof Error ? err.message : "Indexing request failed",
    };
  }
}
