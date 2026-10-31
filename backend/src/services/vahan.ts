import { env } from "../config/env.js";
import { VahanSession } from "../models/VahanSession.js";

const recentCalls: number[] = [];
let tokenRequest: Promise<string> | null = null;

export function vahanConfigured() {
  return Boolean(env.vahanClientId && env.vahanClientSecret && env.vahanSourceId);
}

function baseUrl() {
  return env.vahanBaseUrl.replace(/\/$/, "");
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    copy[key] = /token|secret|authorization/i.test(key) ? "[redacted]" : redact(item);
  }
  return copy;
}

function logVahan(path: string, status: number, data: unknown) {
  console.log("Vahan response", status, path, JSON.stringify(redact(data)));
}

export function allowVahanCall() {
  const now = Date.now();
  while (recentCalls.length && recentCalls[0] < now - 60_000) recentCalls.shift();
  if (recentCalls.length >= 50) return false;
  recentCalls.push(now);
  return true;
}

async function requestToken() {
  const response = await fetch(`${baseUrl()}/mitra/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-use-node-22": "true",
    },
    body: JSON.stringify({
      client_id: env.vahanClientId,
      client_secret: env.vahanClientSecret,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    accessToken?: string;
    expiry?: number;
    message?: string;
  };
  logVahan("/mitra/oauth/token", response.status, data);
  if (!response.ok || !data.accessToken) {
    throw new Error(data.message || "Could not start a partner session.");
  }
  const expiresAt = new Date(Date.now() + Math.max(60, (data.expiry || 7200) - 120) * 1000);
  await VahanSession.deleteMany({});
  await VahanSession.create({ accessToken: data.accessToken, expiresAt });
  return data.accessToken;
}

export async function vahanToken(force = false) {
  if (!vahanConfigured()) throw new Error("Partner uniqueness check is not configured.");
  if (!force) {
    const saved = await VahanSession.findOne().sort({ expiresAt: -1 });
    if (saved && saved.expiresAt.getTime() > Date.now() + 60_000) return saved.accessToken;
  }
  if (!tokenRequest) {
    tokenRequest = requestToken().finally(() => {
      tokenRequest = null;
    });
  }
  return tokenRequest;
}

async function vahanRequest(path: string, body?: unknown, retry = true) {
  if (!allowVahanCall()) {
    const error = new Error("Partner rate limit reached.");
    error.name = "VahanRateLimit";
    throw error;
  }
  const token = await vahanToken();
  const headers: Record<string, string> = {
    "x-use-node-22": "true",
    authorization: `Bearer ${token}`,
  };
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl()}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };
  logVahan(path, response.status, data);
  if (response.status === 401 && retry) {
    await VahanSession.deleteMany({});
    await vahanToken(true);
    return vahanRequest(path, body, false);
  }
  if (!response.ok) {
    throw new Error(data.message || data.error || `Partner request failed (${response.status}).`);
  }
  return data;
}

const locationCache = new Map<string, { at: number; locations: string[] }>();

export async function partnerLocations(city: string, company: string) {
  const key = `${city}|${company}`;
  const cached = locationCache.get(key);
  if (cached && Date.now() - cached.at < 6 * 60 * 60 * 1000) return cached.locations;
  const query = new URLSearchParams({ city, company });
  const data = (await vahanRequest(
    `/mitra/referral/getAvailableJobLocationsByCityAndCompany?${query.toString()}`,
  )) as { data?: { jobLocations?: string[] } };
  const locations = data.data?.jobLocations || [];
  locationCache.set(key, { at: Date.now(), locations });
  return locations;
}

export async function submitReferral(input: {
  name: string;
  phone: string;
  clientName: string;
  city: string;
  locality: string;
}) {
  const data = (await vahanRequest("/mitra/referral/basicFormSubmit", {
    userName: input.name,
    userPhoneNumber: input.phone,
    sourceId: env.vahanSourceId,
    source: env.vahanSource,
    clientName: input.clientName,
    city: input.city,
    locality: input.locality,
  })) as {
    data?: {
      uniquenessStatus?: boolean;
      uniquenessMessage?: string;
      result?: {
        recommendationHistoryId?: string;
        scheduledInterviewId?: string;
        userID?: string;
      };
    };
    message?: string;
  };
  return {
    uniquenessStatus: data.data?.uniquenessStatus,
    uniquenessMessage: data.data?.uniquenessMessage || "",
    recommendationHistoryId: data.data?.result?.recommendationHistoryId || "",
    scheduledInterviewId: data.data?.result?.scheduledInterviewId || "",
    partnerUserId: data.data?.result?.userID || "",
    message: data.message || "",
  };
}

export async function riderDetails(phone: string, company: string) {
  const data = (await vahanRequest("/mitra/oauth/riderDetails", {
    source_id: env.vahanSourceId,
    company_name: company,
    phone_number: phone,
  })) as {
    success?: boolean;
    message?: string;
    data?: Array<{ phoneNumber?: string; status?: string; companyName?: string }>;
  };
  const rows = data.data || [];
  return (
    rows.find((row) => String(row.phoneNumber || "") === phone) ||
    rows.find((row) => String(row.companyName || "").toLowerCase() === company.toLowerCase()) ||
    rows[0] ||
    null
  );
}
