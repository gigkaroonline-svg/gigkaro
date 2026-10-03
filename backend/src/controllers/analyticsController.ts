import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createHash } from "crypto";
import { AnalyticsEvent } from "../models/AnalyticsEvent.js";

const eventSchema = z.object({
  type: z.enum(["pageview", "event"]),
  name: z.string().trim().max(80).optional().default(""),
  path: z.string().trim().min(1).max(500),
  title: z.string().trim().max(200).optional().default(""),
  referrer: z.string().trim().max(1000).optional().default(""),
  source: z.string().trim().max(120).optional().default(""),
  medium: z.string().trim().max(120).optional().default(""),
  campaign: z.string().trim().max(160).optional().default(""),
  utmSource: z.string().trim().max(120).optional().default(""),
  utmMedium: z.string().trim().max(120).optional().default(""),
  utmCampaign: z.string().trim().max(160).optional().default(""),
  utmContent: z.string().trim().max(160).optional().default(""),
  utmTerm: z.string().trim().max(160).optional().default(""),
  visitorId: z.string().trim().min(8).max(80),
  sessionId: z.string().trim().min(8).max(80),
  userId: z.string().trim().max(80).optional().default(""),
  language: z.string().trim().max(40).optional().default(""),
  screen: z.string().trim().max(40).optional().default(""),
  props: z.record(z.unknown()).optional().default({}),
});

const collectSchema = z.object({
  events: z.array(eventSchema).min(1).max(25),
});

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  return req.socket.remoteAddress || "";
}

function inferSource(referrer: string, utmSource: string, utmMedium: string) {
  if (utmSource) {
    return {
      source: utmSource,
      medium: utmMedium || "campaign",
    };
  }
  if (!referrer) {
    return { source: "direct", medium: "none" };
  }
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (
      host.includes("google.") ||
      host === "google.com" ||
      host.endsWith(".google.com")
    ) {
      return { source: "google", medium: "organic" };
    }
    if (host.includes("bing.")) return { source: "bing", medium: "organic" };
    if (host.includes("facebook.") || host === "fb.com" || host.includes("instagram.")) {
      return { source: host, medium: "social" };
    }
    if (host.includes("whatsapp.") || host === "wa.me") {
      return { source: "whatsapp", medium: "social" };
    }
    return { source: host, medium: "referral" };
  } catch {
    return { source: "referral", medium: "referral" };
  }
}

export async function collectAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = collectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid analytics payload." });
      return;
    }

    const ua = String(req.headers["user-agent"] || "").slice(0, 300);
    const ipHash = createHash("sha256")
      .update(clientIp(req) || "unknown")
      .digest("hex")
      .slice(0, 16);

    const docs = parsed.data.events
      .filter((event) => {
        const path = event.path.split("?")[0] || "/";
        return !/^\/(admin|candidate|employer|login|register|verify-otp)(\/|$)/.test(
          path,
        );
      })
      .map((event) => {
      const inferred = inferSource(
        event.referrer,
        event.utmSource,
        event.utmMedium,
      );
      return {
        type: event.type,
        name: event.type === "event" ? event.name || "event" : "pageview",
        path: event.path.slice(0, 500),
        title: event.title.slice(0, 200),
        referrer: event.referrer.slice(0, 1000),
        source: (event.source || inferred.source).slice(0, 120),
        medium: (event.medium || inferred.medium).slice(0, 120),
        campaign: (event.campaign || event.utmCampaign || "").slice(0, 160),
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        utmContent: event.utmContent,
        utmTerm: event.utmTerm,
        visitorId: event.visitorId,
        sessionId: event.sessionId,
        userId: event.userId || "",
        userAgent: ua,
        language: event.language.slice(0, 40),
        screen: event.screen.slice(0, 40),
        props: {
          ...event.props,
          ipHash,
        },
      };
    });

    if (!docs.length) {
      res.status(204).end();
      return;
    }

    await AnalyticsEvent.insertMany(docs, { ordered: false });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function parseDay(value: unknown): Date | null {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const publicTrafficMatch = {
  path: {
    $not: {
      $regex: "^/(admin|candidate|employer|login|register|verify-otp)(/|$|\\?)",
    },
  },
};

export async function analyticsTraffic(
  req: { query?: Record<string, unknown> },
  res: Response,
  next: NextFunction,
) {
  try {
    const today = startOfDay(new Date());
    const preset = String(req.query?.preset || "").trim();
    const fromQuery = parseDay(req.query?.from);
    const toQuery = parseDay(req.query?.to);

    let from = fromQuery ? startOfDay(fromQuery) : null;
    let to = toQuery ? endOfDay(toQuery) : null;

    if (!from || !to) {
      const days =
        preset === "today"
          ? 0
          : preset === "7d"
            ? 6
            : preset === "90d"
              ? 89
              : 29;
      from = startOfDay(new Date(today));
      from.setDate(from.getDate() - days);
      to = endOfDay(today);
    }

    if (from.getTime() > to.getTime()) {
      const swap = from;
      from = startOfDay(to);
      to = endOfDay(swap);
    }

    // Cap range at 180 days to match retention.
    const maxSpanMs = 180 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxSpanMs) {
      from = new Date(to.getTime() - maxSpanMs);
      from = startOfDay(from);
    }

    const match = {
      createdAt: { $gte: from, $lte: to },
      ...publicTrafficMatch,
    };
    const rangeDays =
      Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) /
        (24 * 60 * 60 * 1000)) + 1;

    const [
      pageviews,
      visitors,
      sessions,
      events,
      topPages,
      topSources,
      topEvents,
      daily,
    ] = await Promise.all([
      AnalyticsEvent.countDocuments({ ...match, type: "pageview" }),
      AnalyticsEvent.distinct("visitorId", match).then((rows) => rows.length),
      AnalyticsEvent.distinct("sessionId", match).then((rows) => rows.length),
      AnalyticsEvent.countDocuments({ ...match, type: "event" }),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "pageview" } },
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              source: { $ifNull: ["$source", "direct"] },
              medium: { $ifNull: ["$medium", "none"] },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "event" } },
        { $group: { _id: "$name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, type: "pageview" } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      rangeDays,
      from: toIsoDay(from),
      to: toIsoDay(to),
      pageviews,
      visitors,
      sessions,
      events,
      topPages: topPages.map((r) => ({ path: r._id, count: r.count })),
      topSources: topSources.map((r) => ({
        source: r._id.source,
        medium: r._id.medium,
        count: r.count,
      })),
      topEvents: topEvents.map((r) => ({ name: r._id, count: r.count })),
      daily: daily.map((r) => ({ date: r._id, count: r.count })),
    });
  } catch (err) {
    next(err);
  }
}
