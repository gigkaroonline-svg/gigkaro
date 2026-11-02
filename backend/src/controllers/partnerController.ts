import type { Response, NextFunction } from "express";
import { z } from "zod";
import { Application } from "../models/Application.js";
import { PartnerCheckSettings } from "../models/PartnerCheckSettings.js";
import { PartnerLead } from "../models/PartnerLead.js";
import { SheetSource } from "../models/SheetSource.js";
import type { AuthRequest } from "../middleware/auth.js";
import { captureSheetBaseline, retryLeadLocality, syncSheetSource } from "../services/partnerCheck.js";
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
  matchColumn?: string;
  matchValues?: string[];
  skipExistingRows?: boolean;
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
    matchColumn: source.matchColumn || "",
    matchValues: (source.matchValues || []).filter(Boolean),
    skipExistingRows: source.skipExistingRows === true,
    active: source.active !== false,
    lastError: source.lastError || "",
    lastSyncedAt: source.lastSyncedAt?.toISOString?.() || null,
    rowsSeen: source.rowsSeen || 0,
    sheetsConfigured: sheetsConfigured(),
  };
}

const sheetObject = z.object({
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
  matchColumn: z.string().trim().max(80).optional(),
  matchValues: z.array(z.string().trim().min(1).max(80)).max(500).optional(),
  active: z.boolean().optional(),
});

function refineSheetMatch(
  data: { matchColumn?: string; matchValues?: string[] },
  ctx: z.RefinementCtx,
) {
  const column = data.matchColumn?.trim() || "";
  const values = data.matchValues || [];
  if (column && !values.length) {
    ctx.addIssue({
      code: "custom",
      message: "Add at least one value that this column must match.",
      path: ["matchValues"],
    });
  }
  if (!column && values.length) {
    ctx.addIssue({
      code: "custom",
      message: "Enter the sheet column that holds these values.",
      path: ["matchColumn"],
    });
  }
}

const sheetBody = sheetObject.superRefine(refineSheetMatch);
const sheetPatch = sheetObject.partial().superRefine(refineSheetMatch);

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

function isoDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : "";
}

type CombinedIndex =
  | { kind: "gigkaro"; id: string; createdAt: string }
  | { kind: "sheet"; key: string; leadIds: string[]; createdAt: string };

export async function listCombinedApplications(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const requestedPage = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const source =
      req.query.source === "gigkaro" || req.query.source === "sheet" ? req.query.source : "";
    const index: CombinedIndex[] = [];

    if (source !== "sheet") {
      const applications = await Application.find().select("createdAt").sort({ createdAt: -1 }).lean();
      for (const application of applications) {
        index.push({
          kind: "gigkaro",
          id: application._id.toString(),
          createdAt: isoDate(application.createdAt),
        });
      }
    }

    if (source !== "gigkaro") {
      const sheetLeads = await PartnerLead.find({ source: "gsheet" })
        .select("sourceRef clientName createdAt")
        .lean();
      const groups = new Map<string, { leadIds: string[]; createdAt: string }>();
      for (const lead of sheetLeads) {
        const key = sheetGroupKey(lead.sourceRef, lead.clientName);
        const createdAt = isoDate(lead.createdAt);
        const group = groups.get(key);
        if (!group) {
          groups.set(key, { leadIds: [lead._id.toString()], createdAt });
          continue;
        }
        group.leadIds.push(lead._id.toString());
        if (createdAt > group.createdAt) group.createdAt = createdAt;
      }
      for (const [key, group] of groups) {
        index.push({ kind: "sheet", key, leadIds: group.leadIds, createdAt: group.createdAt });
      }
    }

    index.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const total = index.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, pages);
    const window = index.slice((page - 1) * limit, page * limit);
    const applicationIds = window.flatMap((row) => (row.kind === "gigkaro" ? [row.id] : []));
    const sheetLeadIds = window.flatMap((row) => (row.kind === "sheet" ? row.leadIds : []));
    const [applications, gigkaroLeads, sheetLeadDocs, sources] = await Promise.all([
      applicationIds.length
        ? Application.find({ _id: { $in: applicationIds } }).populate("jobId", "title company city locality")
        : [],
      applicationIds.length
        ? PartnerLead.find({ source: "gigkaro", applicationIds: { $in: applicationIds } }).sort({ priority: 1 })
        : [],
      sheetLeadIds.length ? PartnerLead.find({ _id: { $in: sheetLeadIds } }) : [],
      sheetLeadIds.length ? SheetSource.find().select("name spreadsheetId tab") : [],
    ]);
    const applicationById = new Map(applications.map((application) => [application._id.toString(), application]));
    const leadsByApplication = new Map<string, typeof gigkaroLeads>();
    for (const lead of gigkaroLeads) {
      for (const id of lead.applicationIds || []) {
        const key = id.toString();
        const list = leadsByApplication.get(key) || [];
        list.push(lead);
        leadsByApplication.set(key, list);
      }
    }
    const sheetLeadById = new Map(sheetLeadDocs.map((lead) => [lead._id.toString(), lead]));
    const sheetNameFor = (sourceRef: string) =>
      sources.find((item) => sourceRef.startsWith(`${item.spreadsheetId}:${item.tab}:`))?.name || "";
    const rows: Array<{
      id: string;
      source: "gigkaro" | "sheet";
      sheetName?: string;
      name: string;
      mobile: string;
      company: string;
      city: string;
      locality: string;
      jobTitle: string;
      partnerStatus: string;
      detail: string;
      checks: { company: string; priority: number; status: string; detail: string }[];
      createdAt: string;
    }> = [];
    for (const item of window) {
      if (item.kind === "gigkaro") {
        const application = applicationById.get(item.id);
        if (!application) continue;
        const job = application.jobId as unknown as {
          title?: string;
          company?: string;
          city?: string;
          locality?: string;
        } | null;
        const partner = application.partnerCheck;
        const checks = (leadsByApplication.get(item.id) || [])
          .sort((a, b) => (a.priority || 99) - (b.priority || 99))
          .map((lead) => ({
            company: lead.clientName,
            priority: lead.priority || 0,
            status: lead.status || "",
            detail: partnerLeadDetail(lead),
          }));
        rows.push({
          id: `gigkaro:${application._id.toString()}`,
          source: "gigkaro",
          name: application.name,
          mobile: application.mobile,
          company: job?.company || partner?.clientName || "",
          city: job?.city || "",
          locality: job?.locality || "",
          jobTitle: job?.title || "",
          partnerStatus: checks.length ? "" : partner?.status || "",
          detail: checks.length ? "" : partner?.detail || "",
          checks,
          createdAt: item.createdAt,
        });
        continue;
      }
      const ordered = item.leadIds
        .flatMap((id) => {
          const lead = sheetLeadById.get(id);
          return lead ? [lead] : [];
        })
        .sort((a, b) => (a.priority || 99) - (b.priority || 99));
      const first = ordered[0];
      if (!first) continue;
      rows.push({
        id: `sheet:${item.key}`,
        source: "sheet",
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
        createdAt: item.createdAt,
      });
    }
    res.json({ rows, page, limit, total, pages });
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
    const source = await SheetSource.create({ ...parsed.data, skipExistingRows: true });
    try {
      await captureSheetBaseline(source._id.toString());
    } catch (err) {
      source.lastError = err instanceof Error ? err.message : "Could not read that sheet.";
      await source.save();
    }
    const saved = await SheetSource.findById(source._id);
    res.status(201).json({ sheet: serializeSheet(saved || source) });
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
    const parsed = sheetPatch.safeParse(req.body);
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
