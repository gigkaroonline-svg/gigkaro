import { env, isAdminIdentifier } from "../config/env.js";
import { User } from "../models/User.js";

export async function bootstrapAdmin() {
  const existing = await User.countDocuments({ role: "admin" });
  if (existing > 0) return;

  const first = env.adminIdentifiers[0];
  if (!first) {
    console.warn("No ADMIN_IDENTIFIERS configured; skipping admin bootstrap.");
    return;
  }

  const isEmail = first.includes("@");
  const mobile = isEmail ? undefined : first;
  const email = isEmail ? first : undefined;

  if (!isAdminIdentifier(mobile, email)) return;

  await User.create({
    ...(mobile ? { mobile } : { email }),
    role: "admin",
    name: "GigKaro Admin",
    profile: {
      name: "GigKaro Admin",
      ...(mobile ? { mobile } : { email }),
    },
  });
  console.log(`Bootstrapped admin user for ${first}`);
}
