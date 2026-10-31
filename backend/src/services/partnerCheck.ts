import { Application } from "../models/Application.js";
import { PartnerCheckSettings } from "../models/PartnerCheckSettings.js";
import { PartnerLead, type PartnerLeadDoc } from "../models/PartnerLead.js";
import { SheetSource } from "../models/SheetSource.js";
import {
  normalizeIndianMobile,
  vahanCityName,
  vahanClientName,
} from "../data/vahanClients.js";
import { readSheet, sheetsConfigured } from "./sheets.js";
import {
  partnerLocations,
  riderDetails,
  submitReferral,
  vahanConfigured,
} from "./vahan.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WAIT_MS = 30 * 60 * 1000;

export async function configuredCheckCompanies() {
  const settings = await PartnerCheckSettings.findOne({ key: "default" }).lean();
  const names: string[] = [];
  for (const value of settings?.companies || []) {
    const official = vahanClientName(value);
    if (official && !names.includes(official)) names.push(official);
  }
  return names.slice(0, 5);
}

async function checkTargets(fallback: string | null) {
  const configured = await configuredCheckCompanies();
  if (configured.length) return configured;
  return fallback ? [fallback] : [];
}

type LeadStatus = PartnerLeadDoc["status"];

function applicationView(lead: {
  status: LeadStatus;
  clientName: string;
  partnerStatus?: string;
  lastError?: string;
}) {
  const detail =
    lead.status === "unique"
      ? `Unique for ${lead.clientName}`
      : lead.status === "not_unique"
        ? lead.partnerStatus
          ? `${lead.partnerStatus} at ${lead.clientName}`
          : `Already referred to ${lead.clientName}`
        : lead.status === "queued" || lead.status === "waiting"
          ? `Checking with ${lead.clientName}.`
          : lead.lastError || "";
  return {
    status: lead.status,
    clientName: lead.clientName,
    detail,
    checkedAt: new Date(),
  };
}

async function mirrorLead(lead: PartnerLeadDoc) {
  if (!lead.applicationIds?.length) return;
  await Application.updateMany(
    { _id: { $in: lead.applicationIds } },
    { $set: { partnerCheck: applicationView(lead) } },
  );
}

async function rememberLead(input: {
  source: "gigkaro" | "gsheet";
  sourceRef: string;
  applicationId?: { toString(): string };
  name: string;
  phone: string;
  companyKey: string;
  clientName: string;
  city: string;
  locality: string;
  status: LeadStatus;
  lastError?: string;
  priority?: number;
}) {
  const since = new Date(Date.now() - 60 * DAY_MS);
  const existing = await PartnerLead.findOne({
    phone: input.phone,
    clientName: input.clientName,
    createdAt: { $gte: since },
    status: { $ne: "failed" },
  }).sort({ createdAt: -1 });
  if (existing) {
    if (input.priority && existing.priority !== input.priority) {
      existing.priority = input.priority;
      await existing.save();
    }
    if (input.applicationId) {
      await PartnerLead.updateOne(
        { _id: existing._id },
        { $addToSet: { applicationIds: input.applicationId } },
      );
      existing.applicationIds = [...(existing.applicationIds || []), input.applicationId as never];
    }
    await mirrorLead(existing);
    return existing;
  }
  try {
    const lead = await PartnerLead.create({
      source: input.source,
      sourceRef: input.sourceRef,
      applicationIds: input.applicationId ? [input.applicationId] : [],
      name: input.name,
      phone: input.phone,
      companyKey: input.companyKey,
      clientName: input.clientName,
      city: input.city,
      locality: input.locality,
      status: input.status,
      lastError: input.lastError || "",
      priority: input.priority || 1,
    });
    await mirrorLead(lead);
    return lead;
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code?: number }).code : 0;
    if (code !== 11000) throw err;
    const saved = await PartnerLead.findOne({ source: input.source, sourceRef: input.sourceRef });
    if (saved && input.applicationId) {
      await PartnerLead.updateOne(
        { _id: saved._id },
        { $addToSet: { applicationIds: input.applicationId } },
      );
      await mirrorLead(saved);
    }
    return saved;
  }
}

export async function enqueueApplicationCheck(
  app: { _id: { toString(): string }; name: string; mobile: string },
  job: { company?: string; companyId?: string; city?: string; locality?: string },
) {
  const targets = await checkTargets(vahanClientName(job.company, job.companyId));
  if (!targets.length) return;
  const phone = normalizeIndianMobile(app.mobile);
  if (!phone) {
    await Application.updateOne(
      { _id: app._id },
      {
        $set: {
          partnerCheck: {
            status: "failed",
            clientName: targets[0],
            detail: "Phone must be a 10-digit mobile starting with 6, 7, 8 or 9.",
            checkedAt: new Date(),
          },
        },
      },
    );
    return;
  }
  const city = vahanCityName(job.city);
  for (const [index, clientName] of targets.entries()) {
    await rememberLead({
      source: "gigkaro",
      sourceRef: `${app._id.toString()}:${clientName}`,
      applicationId: app._id,
      name: app.name,
      phone,
      companyKey: job.companyId || "",
      clientName,
      city: city || "",
      locality: job.locality || "",
      status: city ? "queued" : "needs_locality",
      lastError: city ? "" : `City "${job.city || ""}" is not in the partner city list.`,
      priority: index + 1,
    });
  }
}

async function defer(lead: PartnerLeadDoc, minutes: number, error: string) {
  lead.attempts = (lead.attempts || 0) + 1;
  lead.lastError = error;
  if (lead.attempts >= 5 && lead.status === "queued") {
    lead.status = "failed";
  } else if (lead.attempts >= 8 && lead.status === "waiting") {
    lead.status = "failed";
    lead.lastError = lead.lastError || "Uniqueness result was not ready.";
  } else {
    lead.nextCheckAt = new Date(Date.now() + minutes * 60 * 1000);
  }
  await lead.save();
  await mirrorLead(lead);
}

async function resolveLocality(lead: PartnerLeadDoc) {
  if (!lead.city) {
    lead.status = "needs_locality";
    lead.lastError = "Choose a partner city before this rider can be checked.";
    lead.nextCheckAt = new Date(Date.now() + WAIT_MS);
    await lead.save();
    await mirrorLead(lead);
    return false;
  }
  const locations = await partnerLocations(lead.city, lead.clientName);
  const locality = locations[0]?.trim();
  if (locality) {
    lead.locality = locality;
    lead.lastError = "";
    if (lead.status === "needs_locality") lead.status = "queued";
    return true;
  }
  lead.status = "needs_locality";
  lead.lastError = `No partner localities for ${lead.clientName} in ${lead.city}.`;
  lead.nextCheckAt = new Date(Date.now() + WAIT_MS);
  await lead.save();
  await mirrorLead(lead);
  return false;
}

async function submitLead(lead: PartnerLeadDoc) {
  const ready = await resolveLocality(lead);
  if (!ready || lead.status === "needs_locality") return;
  const result = await submitReferral({
    name: lead.name || "Rider",
    phone: lead.phone,
    clientName: lead.clientName,
    city: lead.city,
    locality: lead.locality,
  });
  lead.recommendationHistoryId = result.recommendationHistoryId;
  lead.scheduledInterviewId = result.scheduledInterviewId;
  lead.partnerUserId = result.partnerUserId;
  lead.lastError = "";
  lead.checkedAt = new Date();
  lead.nextCheckAt = undefined;
  if (typeof result.uniquenessStatus === "boolean") {
    lead.status = result.uniquenessStatus ? "unique" : "not_unique";
    lead.partnerStatus = result.uniquenessMessage || "";
    await lead.save();
    await mirrorLead(lead);
    return;
  }
  lead.status = "waiting";
  await lead.save();
  await mirrorLead(lead);
  await settleLead(lead);
}

async function settleLead(lead: PartnerLeadDoc) {
  const row = await riderDetails(lead.phone, lead.clientName);
  const raw = String(row?.status || "").trim();
  if (!raw) {
    await defer(lead, 1, "Uniqueness result is not ready yet.");
    return;
  }
  lead.partnerStatus = raw;
  lead.status = raw.toLowerCase() === "unique" ? "unique" : "not_unique";
  lead.lastError = "";
  lead.checkedAt = new Date();
  lead.nextCheckAt = undefined;
  await lead.save();
  await mirrorLead(lead);
}

async function processLeads() {
  const leads = await PartnerLead.find({
    status: { $in: ["queued", "waiting", "needs_locality"] },
    $or: [
      { status: "waiting" },
      { nextCheckAt: null },
      { nextCheckAt: { $lte: new Date() } },
    ],
  })
    .sort({ priority: 1, createdAt: 1 })
    .limit(8);
  for (const lead of leads) {
    try {
      if (lead.status === "waiting") await settleLead(lead);
      else await submitLead(lead);
    } catch (err) {
      if (err instanceof Error && err.name === "VahanRateLimit") return;
      const message = err instanceof Error ? err.message : "Partner check failed.";
      await defer(lead, 5, message);
    }
  }
}

function cell(row: string[], headers: string[], header: string) {
  const index = headers.findIndex((item) => item.trim().toLowerCase() === header.trim().toLowerCase());
  return index >= 0 ? String(row[index] || "").trim() : "";
}

export async function syncSheetSource(id: string) {
  const source = await SheetSource.findById(id);
  if (!source) throw new Error("Sheet not found.");
  if (!sheetsConfigured()) {
    source.lastError = "Google service account is not configured.";
    await source.save();
    return { source, added: 0 };
  }
  try {
    const rows = await readSheet(source.spreadsheetId, source.tab);
    const headers = (rows[0] || []).map((header) => String(header || ""));
    const configured = await configuredCheckCompanies();
    let added = 0;
    for (const row of rows.slice(1)) {
      const company = cell(row, headers, source.columns?.company || "Company");
      const named = vahanClientName(company);
      const targets: string[] = configured.length ? configured : named ? [named] : [];
      const phone = normalizeIndianMobile(cell(row, headers, source.columns?.phone || "Phone"));
      if (!targets.length || !phone) continue;
      const cityName = cell(row, headers, source.columns?.city || "City");
      const city = vahanCityName(cityName);
      for (const [index, clientName] of targets.entries()) {
        const saved = await rememberLead({
          source: "gsheet",
          sourceRef: `${source.spreadsheetId}:${source.tab}:${phone}:${clientName}`,
          name: cell(row, headers, source.columns?.name || "Name"),
          phone,
          companyKey: company,
          clientName,
          city: city || "",
          locality: cell(row, headers, source.columns?.locality || "Locality"),
          status: city ? "queued" : "needs_locality",
          lastError: city ? "" : `City "${cityName}" is not in the partner city list.`,
          priority: index + 1,
        });
        if (saved) added += 1;
      }
    }
    source.rowsSeen = Math.max(0, rows.length - 1);
    source.lastError = "";
    source.lastSyncedAt = new Date();
    await source.save();
    return { source, added };
  } catch (err) {
    source.lastError = err instanceof Error ? err.message : "Could not read that sheet.";
    source.lastSyncedAt = new Date();
    await source.save();
    throw err;
  }
}

async function syncActiveSheets() {
  if (!sheetsConfigured()) return;
  const sources = await SheetSource.find({ active: true }).select("_id");
  for (const source of sources) {
    try {
      await syncSheetSource(source._id.toString());
    } catch (err) {
      console.error(
        "Sheet sync failed",
        err instanceof Error ? err.message : err,
      );
    }
  }
}

let running = false;
let lastSheetSync = 0;
let warned = false;

export function startPartnerChecks() {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      if (Date.now() - lastSheetSync > 2 * 60 * 1000) {
        lastSheetSync = Date.now();
        await syncActiveSheets();
      }
      if (!vahanConfigured()) {
        if (!warned) {
          console.log("Partner uniqueness checks are off until Vahan credentials are set.");
          warned = true;
        }
        return;
      }
      await processLeads();
    } catch (err) {
      console.error("Partner check failed", err instanceof Error ? err.message : err);
    } finally {
      running = false;
    }
  };
  void tick();
  setInterval(() => void tick(), 20_000);
}

export async function retryLeadLocality(
  applicationId: string,
  input: { locality: string; city?: string },
) {
  const lead = await PartnerLead.findOne({ applicationIds: applicationId }).sort({ createdAt: -1 });
  if (!lead) return null;
  const city = input.city ? vahanCityName(input.city) : lead.city || null;
  if (input.city && !city) {
    const error = new Error("That city is not in the partner city list.");
    error.name = "BadCity";
    throw error;
  }
  if (city) lead.city = city;
  lead.locality = input.locality.trim();
  lead.status = lead.city ? "queued" : "needs_locality";
  lead.lastError = lead.city ? "" : "Choose a partner city before this rider can be checked.";
  lead.attempts = 0;
  lead.set("nextCheckAt", null);
  await lead.save();
  await mirrorLead(lead);
  return lead;
}
