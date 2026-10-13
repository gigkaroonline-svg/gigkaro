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
  if (
    !env.whatsappPhoneNumberId ||
    !env.whatsappAccessToken ||
    !env.whatsappApplicationTemplate ||
    !recipients.length
  ) {
    console.warn(
      "WhatsApp alert skipped: set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_APPLICATION_TEMPLATE, WHATSAPP_NOTIFY_TO.",
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
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
              name: env.whatsappApplicationTemplate,
              language: { code: env.whatsappTemplateLanguage },
              components: [{ type: "body", parameters }],
            },
          }),
        });
        const body = await res.text();
        if (!res.ok) {
          console.error("WhatsApp alert failed:", res.status, body.slice(0, 300));
          return;
        }
        console.log("WhatsApp alert sent for application:", input.candidateMobile);
      } catch (err) {
        console.error("WhatsApp alert error:", err);
      }
    }),
  );
}
