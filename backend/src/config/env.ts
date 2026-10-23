import "dotenv/config";

function parseIdentifiers(raw: string | undefined) {
  return (raw || "9999999999,admin@gigkaro.local")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gigkaro",
  jwtSecret: process.env.JWT_SECRET || "gigkaro-dev-secret",
  corsOrigin: process.env.CORS_ORIGIN || "http://127.0.0.1:3000",
  devOtp: process.env.DEV_OTP || "123456",
  adminIdentifiers: parseIdentifiers(process.env.ADMIN_IDENTIFIERS),
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "",
  contactTo: process.env.CONTACT_TO || "info@gigkaro.in",
  gcsBucket: process.env.GCS_BUCKET || "",
  gcsProjectId: process.env.GCS_PROJECT_ID || "",
  gcsClientEmail: process.env.GCS_CLIENT_EMAIL || "",
  gcsPrivateKey: (process.env.GCS_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  metaGraphApiVersion: process.env.META_GRAPH_API_VERSION || "v21.0",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  whatsappWabaId: process.env.WHATSAPP_WABA_ID || "",
  whatsappApplicationTemplate: process.env.WHATSAPP_APPLICATION_TEMPLATE || "",
  whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_IN",
  whatsappNotifyTo: (process.env.WHATSAPP_NOTIFY_TO || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export function isAdminIdentifier(mobile?: string, email?: string) {
  const values = [
    mobile?.trim().toLowerCase(),
    email?.trim().toLowerCase(),
  ].filter(Boolean) as string[];
  return values.some((v) => env.adminIdentifiers.includes(v));
}
