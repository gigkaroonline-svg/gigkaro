import { env, isAdminIdentifier } from "../config/env.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";

async function ensureAdminPassword() {
  if (!env.adminEmail || !env.adminPassword) return;

  const email = env.adminEmail;
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    const passwordHash = await hashPassword(env.adminPassword);
    await User.create({
      email,
      role: "admin",
      name: "GigKaro Admin",
      passwordHash,
      profile: { email, name: "GigKaro Admin" },
    });
    console.log(`Created admin ${email}`);
    return;
  }

  if (user.role === "admin" && !user.passwordHash) {
    user.passwordHash = await hashPassword(env.adminPassword);
    await user.save();
    console.log(`Set password for admin ${email}`);
  }
}

export async function bootstrapAdmin() {
  await ensureAdminPassword();

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
