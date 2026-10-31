import type { Response, NextFunction } from "express";
import { z } from "zod";
import { Application } from "../models/Application.js";
import { PartnerCheckSettings } from "../models/PartnerCheckSettings.js";
import { PartnerLead } from "../models/PartnerLead.js";
import { SheetSource } from "../models/SheetSource.js";
import type { AuthRequest } from "../middleware/auth.js";
import { retryLeadLocality, syncSheetSource } from "../services/partnerCheck.js";
import { sheetsConfigured } from "../services/sheets.js";
import { VAHAN_COMPANIES, vahanClientName } from "../data/vahanClients.js";

function serializeSheet(source: {
  _id: { toString(): string };
  name: string;
  spreadsheetId: string;
  tab: string;
  columns?: {
    name?: string;
    phone?: string;
    city?: string;
    company?: string;
    locality?: string;
  } | null;
  active?: boolean;
  lastError?: string;
  lastSyncedAt?: Date | null;
  rowsSeen?: number;
}) {
  return {
    id: source._id.toString(),
    name: source.name,
    spreadsheetId: source.spreadsheetId,
    tab: source.tab,
    columns: {
      name: source.columns?.name || "Name",
      phone: source.columns?.phone || "Phone",
      city: source.columns?.city || "City",
      company: source.columns?.company || "Company",
      locality: source.columns?.locality || "Locality",
    },
    active: source.active !== false,
    lastError: source.lastError || "",
    lastSyncedAt: source.lastSyncedAt?.toISOString?.() || null,
    rowsSeen: source.rowsSeen || 0,
    sheetsConfigured: sheetsConfigured(),
  };
}

const sheetBody = z.object({
  name: z.string().trim().min(1).max(80),
  spreadsheetId: z.string().trim().min(8).max(200),
  tab: z.string().trim().min(1).max(80),
  columns: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      phone: z.string().trim().min(1).max(80).optional(),
      city: z.string().trim().min(1).max(80).optional(),
      company: z.string().trim().min(1).max(80).optional(),
      locality: z.string().trim().min(1).max(80).optional(),
    })
    .optional(),
  active: z.boolean().optional(),
});

function partnerLeadDetail(lead: {
  status?: string;
  clientName?: string;
  partnerStatus?: string;
  lastError?: string;
}) {
  if (lead.status === "unique") return `Unique for ${lead.clientName}`;
  if (lead.status === "not_unique") {
    return lead.partnerStatus
      ? `${lead.partnerStatus} at ${lead.clientName}`
      : `Already referred to ${lead.clientName}`;
  }
  return lead.lastError || "";
}

function sheetGroupKey(sourceRef: string, clientName: string) {
  const suffix = `:${clientName}`;
  return sourceRef.endsWith(suffix) ? sourceRef.slice(0, -suffix.length) : sourceRef;
}

export async function listCombinedApplications(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const [applications, sheetLeads, sources] = await Promise.all([
      Application.find().sort({ createdAt: -1 }).limit(200).populate("jobId", "title company city locality"),
      PartnerLead.find({ source: "gsheet" }).sort({ priority: 1, createdAt: -1 }).limit(1000),
      SheetSource.find().select("name spreadsheetId tab"),
    ]);
    const applicationIds = applications.map((application) => application._id);
    const gigkaroLeads = applicationIds.length
      ? await PartnerLead.find({ source: "gigkaro", applicationIds: { $in: applicationIds } }).sort({
          priority: 1,
        })
      : [];
    const sheetNameFor = (sourceRef: string) =>
      sources.find((source) => sourceRef.startsWith(`${source.spreadsheetId}:${source.tab}:`))?.name ||
      "";
    const sheetGroups = new Map<string, typeof sheetLeads>();
    for (const lead of sheetLeads) {
      const key = sheetGroupKey(lead.sourceRef, lead.clientName);
      const group = sheetGroups.get(key) || [];
      group.push(lead);
      sheetGroups.set(key, group);
    }
    const rows = [
      ...applications.map((application) => {
        const job = application.jobId as unknown as {
          title?: string;
          company?: string;
          city?: string;
          locality?: string;
        } | null;
        const partner = application.partnerCheck;
        const checks = gigkaroLeads
          .filter((lead) =>
            lead.applicationIds?.some((id) => id.toString() === application._id.toString()),
          )
          .sort((a, b) => (a.priority || 99) - (b.priority || 99))
          .map((lead) => ({
            company: lead.clientName,
            priority: lead.priority || 0,
            status: lead.status || "",
            detail: partnerLeadDetail(lead),
          }));
        return {
          id: `gigkaro:${application._id.toString()}`,
          source: "gigkaro" as const,
          name: application.name,
          mobile: application.mobile,
          company: job?.company || partner?.clientName || "",
          city: job?.city || "",
          locality: job?.locality || "",
          jobTitle: job?.title || "",
          partnerStatus: checks.length ? "" : partner?.status || "",
          detail: checks.length ? "" : partner?.detail || "",
          checks,
          createdAt: application.createdAt?.toISOString?.() ?? "",
        };
      }),
      ...[...sheetGroups.values()].map((group) => {
        const ordered = [...group].sort((a, b) => (a.priority || 99) - (b.priority || 99));
        const first = ordered[0];
        const key = sheetGroupKey(first.sourceRef, first.clientName);
        return {
          id: `sheet:${key}`,
          source: "sheet" as const,
          sheetName: sheetNameFor(first.sourceRef),
          name: ordered.find((lead) => lead.name)?.name || "",
          mobile: first.phone,
          company: "",
          city: first.city || "",
          locality: first.locality || "",
          jobTitle: "",
          partnerStatus: "",
          detail: "",
          checks: ordered.map((lead) => ({
            company: lead.clientName,
            priority: lead.priority || 0,
            status: lead.status || "",
            detail: partnerLeadDetail(lead),
          })),
          createdAt:
            ordered
              .map((lead) => lead.createdAt?.toISOString?.() ?? "")
              .sort()
              .at(-1) || "",
        };
      }),
    ]
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 200);
    res.json({ rows });
  } catch (err) {
    next(err);
  }
}

export async function listPartnerSheets(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sources = await SheetSource.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      sheetsConfigured: sheetsConfigured(),
      sheets: sources.map((source) => serializeSheet(source)),
    });
  } catch (err) {
    next(err);
  }
}

export async function createPartnerSheet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = sheetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "Enter the sheet details." });
      return;
    }
    const source = await SheetSource.create(parsed.data);
    res.status(201).json({ sheet: serializeSheet(source) });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code?: number }).code : 0;
    if (code === 11000) {
      res.status(409).json({ error: "That spreadsheet tab is already connected." });
      return;
    }
    next(err);
  }
}

export async function patchPartnerSheet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = sheetBody.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "Check the sheet details." });
      return;
    }
    const source = await SheetSource.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!source) {
      res.status(404).json({ error: "Sheet not found." });
      return;
    }
    res.json({ sheet: serializeSheet(source) });
  } catch (err) {
    next(err);
  }
}

export async function deletePartnerSheet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const source = await SheetSource.findByIdAndDelete(req.params.id);
    if (!source) {
      res.status(404).json({ error: "Sheet not found." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function syncPartnerSheet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await syncSheetSource(String(req.params.id));
    res.json({ sheet: serializeSheet(result.source), added: result.added });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not sync that sheet.";
    if (message === "Sheet not found.") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function patchApplicationLocality(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = z
      .object({
        locality: z.string().trim().min(1).max(120),
        city: z.string().trim().max(80).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter the partner locality." });
      return;
    }
    const lead = await retryLeadLocality(String(req.params.id), parsed.data);
    if (!lead) {
      res.status(404).json({ error: "This application is not waiting on a partner check." });
      return;
    }
    res.json({
      partnerCheck: {
        status: lead.status,
        clientName: lead.clientName,
        detail: lead.lastError || "",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "BadCity") {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function listCheckCompanies(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await PartnerCheckSettings.findOne({ key: "default" }).lean();
    const companies: string[] = [];
    for (const value of settings?.companies || []) {
      const official = vahanClientName(value);
      if (official && !companies.includes(official)) companies.push(official);
    }
    res.json({ companies: companies.slice(0, 5), options: VAHAN_COMPANIES });
  } catch (err) {
    next(err);
  }
}

export async function saveCheckCompanies(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = z.object({ companies: z.array(z.string()) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Choose five partner companies." });
      return;
    }
    const companies: string[] = [];
    for (const value of parsed.data.companies) {
      const official = vahanClientName(value);
      if (official && !companies.includes(official)) companies.push(official);
    }
    if (companies.length !== 5) {
      res.status(400).json({ error: "Choose five partner companies." });
      return;
    }
    const settings = await PartnerCheckSettings.findOneAndUpdate(
      { key: "default" },
      { key: "default", companies },
      { new: true, upsert: true },
    );
    res.json({ companies: settings?.companies || companies });
  } catch (err) {
    next(err);
  }
}
