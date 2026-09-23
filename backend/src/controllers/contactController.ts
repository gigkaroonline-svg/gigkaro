import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { env } from "../config/env.js";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(4000),
});

export async function submitContact(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Check your name, email and message." });
      return;
    }

    const { name, email, message } = parsed.data;
    const origin = req.get("origin") || env.corsOrigin;
    const response = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(env.contactTo)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: origin,
          Referer: `${origin.replace(/\/$/, "")}/contact/`,
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _replyto: email,
          _subject: `GigKaro contact from ${name}`,
          _template: "table",
          _captcha: "false",
        }),
      },
    );

    const data = (await response.json().catch(() => null)) as {
      success?: string | boolean;
      message?: string;
    } | null;
    const success = data?.success === true || data?.success === "true";
    const note = data?.message || "";
    const pendingActivation = /activat/i.test(note);

    if (!response.ok || (!success && !pendingActivation)) {
      res.status(502).json({
        error: note || "Could not deliver your message.",
      });
      return;
    }

    res.json({
      ok: true,
      to: env.contactTo,
      pendingActivation,
    });
  } catch (err) {
    next(err);
  }
}
