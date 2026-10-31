import crypto from "crypto";
import { env } from "../config/env.js";

let cachedToken = "";
let cachedUntil = 0;

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

export function sheetsConfigured() {
  return Boolean(env.gcsClientEmail && env.gcsPrivateKey);
}

export function sheetErrorMessage(message: string) {
  const text = message.replace(/\s+/g, " ").trim();
  if (/has not been used|it is disabled|sheets\.googleapis\.com/i.test(text)) {
    const url = text.match(/https:\/\/console\.(?:developers|cloud)\.google\.com\/\S+/)?.[0];
    return url
      ? `Google Sheets is turned off for this Google project. Enable it, wait a minute, then sync again. ${url}`
      : "Google Sheets is turned off for this Google project. Enable it, wait a minute, then sync again.";
  }
  if (/permission|forbidden|403/i.test(text)) {
    return "This account cannot open that sheet. Share it with the storage service account as a viewer.";
  }
  if (/unable to parse range|not found/i.test(text) && /tab|range/i.test(text)) {
    return "That tab was not found. Check the tab name.";
  }
  if (/requested entity was not found|spreadsheet/i.test(text) && /not found/i.test(text)) {
    return "That spreadsheet was not found. Check the spreadsheet id.";
  }
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

async function googleToken() {
  if (cachedToken && cachedUntil > Date.now() + 60_000) return cachedToken;
  if (!sheetsConfigured()) {
    throw new Error("Google service account is not configured.");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: env.gcsClientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(env.gcsPrivateKey);
  const assertion = `${unsigned}.${signature.toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Could not authorize Google Sheets.");
  }
  cachedToken = data.access_token;
  cachedUntil = Date.now() + 50 * 60 * 1000;
  return cachedToken;
}

export async function readSheet(spreadsheetId: string, tab: string) {
  const token = await googleToken();
  const safeTab = tab.replace(/'/g, "''");
  const range = encodeURIComponent(`'${safeTab}'!A:ZZ`);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  const data = (await response.json().catch(() => ({}))) as {
    values?: string[][];
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(sheetErrorMessage(data.error?.message || "Could not read that sheet."));
  }
  return data.values || [];
}
