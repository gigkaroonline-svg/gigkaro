import { env } from "../config/env.js";

type ApplicationSmsInput = {
  jobTitle: string;
  locality: string;
  candidateName: string;
  candidateMobile: string;
};

function buildApplicationMessage(input: ApplicationSmsInput) {
  return [
    `You have received a new application for ${input.jobTitle} in ${input.locality}.`,
    "",
    `Candidate Name: ${input.candidateName}`,
    `Contact Number: ${input.candidateMobile}`,
    "",
    "Please review the application for further action.",
  ].join("\n");
}

/** Notify ops when a candidate applies. Never throws. */
export async function sendApplicationSms(input: ApplicationSmsInput) {
  if (!env.gupshupUserId || !env.gupshupPassword || !env.gupshupNotifyTo) {
    console.warn(
      "Gupshup SMS skipped: set GUPSHUP_USERID, GUPSHUP_PASSWORD, GUPSHUP_NOTIFY_TO.",
    );
    return;
  }

  const params = new URLSearchParams({
    userid: env.gupshupUserId,
    password: env.gupshupPassword,
    send_to: env.gupshupNotifyTo,
    v: "1.1",
    format: "json",
    msg_type: "TEXT",
    method: "SENDMESSAGE",
    msg: buildApplicationMessage(input),
    isTemplate: "true",
    footer: "Team GigKaro",
  });

  try {
    const res = await fetch(
      `https://mediaapi.smsgupshup.com/GatewayAPI/rest?${params.toString()}`,
    );
    const body = await res.text();
    if (!res.ok) {
      console.error("Gupshup SMS failed:", res.status, body.slice(0, 300));
      return;
    }
    console.log("Gupshup SMS sent for application:", input.candidateMobile);
  } catch (err) {
    console.error("Gupshup SMS error:", err);
  }
}
