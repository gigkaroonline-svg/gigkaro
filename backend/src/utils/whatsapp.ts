import { env } from "../config/env.js";

type ApplicationAlertInput = {
  jobTitle: string;
  locality: string;
  candidateName: string;
  candidateMobile: string;
};

/** Meta wants digits only with the country code; bare 10-digit Indian numbers get 91. */
function toWhatsAppNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/** Template text values cannot contain newlines, tabs or more than four spaces in a row. */
function templateText(value: string) {
  return value.replace(/\s+/g, " ").trim() || "-";
}

/**
 * Notify ops on WhatsApp when a candidate applies. Never throws.
 * The approved template's body fills {{1}} job title, {{2}} locality, {{3}} candidate name, {{4}} candidate mobile.
 */
export async function sendApplicationWhatsApp(input: ApplicationAlertInput) {
  const recipients = env.whatsappNotifyTo.map(toWhatsAppNumber).filter(Boolean);
  const missing = [
    !env.whatsappPhoneNumberId && "WHATSAPP_PHONE_NUMBER_ID",
    !env.whatsappAccessToken && "WHATSAPP_ACCESS_TOKEN",
    !env.whatsappApplicationTemplate && "WHATSAPP_APPLICATION_TEMPLATE",
    !recipients.length && "WHATSAPP_NOTIFY_TO",
  ].filter(Boolean);
  if (missing.length) {
    console.warn(
      "[WhatsApp] skipped application alert. Missing:",
      missing.join(", "),
    );
    return;
  }

  const url = `https://graph.facebook.com/${env.metaGraphApiVersion}/${env.whatsappPhoneNumberId}/messages`;
  const parameters = [
    input.jobTitle,
    input.locality,
    input.candidateName,
    input.candidateMobile,
  ].map((text) => ({ type: "text", text: templateText(text) }));

  await Promise.all(
    recipients.map(async (to) => {
      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: env.whatsappApplicationTemplate,
          language: { code: env.whatsappTemplateLanguage },
          components: [{ type: "body", parameters }],
        },
      };
      console.log("[WhatsApp] sending", {
        to,
        template: env.whatsappApplicationTemplate,
        language: env.whatsappTemplateLanguage,
        parameters: parameters.map((item) => item.text),
        candidateMobile: input.candidateMobile,
      });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const body = await res.text();
        let parsed: { messages?: { id?: string }[]; error?: { message?: string; code?: number } } =
          {};
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = {};
        }
        if (!res.ok) {
          console.error("[WhatsApp] Meta rejected the message", {
            to,
            status: res.status,
            code: parsed.error?.code,
            message: parsed.error?.message || body.slice(0, 500),
          });
          return;
        }
        console.log("[WhatsApp] Meta accepted the message", {
          to,
          messageId: parsed.messages?.[0]?.id || "",
          candidateMobile: input.candidateMobile,
        });
      } catch (err) {
        console.error("[WhatsApp] request failed", { to, err });
      }
    }),
  );
}
