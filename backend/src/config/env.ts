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
  contactTo: process.env.CONTACT_TO || "info@gigkaro.in",
  gcsBucket: process.env.GCS_BUCKET || "",
  gcsProjectId: process.env.GCS_PROJECT_ID || "",
  gcsClientEmail: process.env.GCS_CLIENT_EMAIL || "",
  gcsPrivateKey: (process.env.GCS_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  gupshupUserId: process.env.GUPSHUP_USERID || "",
  gupshupPassword: process.env.GUPSHUP_PASSWORD || "",
  gupshupNotifyTo: process.env.GUPSHUP_NOTIFY_TO || "",
};

export function isAdminIdentifier(mobile?: string, email?: string) {
  const values = [
    mobile?.trim().toLowerCase(),
    email?.trim().toLowerCase(),
  ].filter(Boolean) as string[];
  return values.some((v) => env.adminIdentifiers.includes(v));
}
