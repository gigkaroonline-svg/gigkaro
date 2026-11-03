/**
 * Upserts field service and telecaller jobs for companies already listed on GigKaro.
 * Run: npx tsx scripts/seed-field-telecaller-jobs.ts
 */
import "dotenv/config";
import { connectDb } from "../src/config/db.js";
import { Company } from "../src/models/Company.js";
import { Job } from "../src/models/Job.js";

const seedLocation = {
  city: "Bengaluru",
  locality: "Koramangala",
  pincode: "560034",
  lat: 12.9352,
  lng: 77.6245,
};

type RoleSeed = {
  companyKey: string;
  category: "field" | "telecaller";
  title: string;
  slug: string;
  salaryMin: number;
  salaryMax: number;
  incentiveMax: number;
  openings: number;
  vehicle: "Bike required" | "EV accepted" | "No vehicle required";
  employmentType: "Full-time" | "Part-time" | "Flexible";
  shift: "Morning" | "Evening" | "Night" | "Flexible";
  description: string;
};

const roles: RoleSeed[] = [
  // Field Service Workers
  {
    companyKey: "snabbit",
    category: "field",
    title: "Field Service Executive",
    slug: "snabbit-field-service-executive",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 4000,
    openings: 20,
    vehicle: "Bike required",
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Snabbit is hiring field service executives for on-site customer visits. Complete assigned jobs across your local area, update status in the app, and keep every visit professional.",
  },
  {
    companyKey: "gigkaro",
    category: "field",
    title: "Field Executive",
    slug: "gigkaro-field-executive",
    salaryMin: 16000,
    salaryMax: 25000,
    incentiveMax: 3000,
    openings: 18,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "GigKaro is hiring field executives for partner site visits. Complete on-ground tasks across your area, coordinate with local teams, and close daily job cards on time.",
  },
  {
    companyKey: "xpress-bees",
    category: "field",
    title: "Field Operations Executive",
    slug: "xpress-bees-field-operations-executive",
    salaryMin: 17000,
    salaryMax: 26000,
    incentiveMax: 3500,
    openings: 12,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Xpress Bees is hiring field operations executives. Visit hubs and partner points, support on-ground checks, and help keep last-mile operations running smoothly.",
  },
  {
    companyKey: "porter",
    category: "field",
    title: "Partner Onboarding Executive",
    slug: "porter-partner-onboarding-executive",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 4000,
    openings: 10,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Porter is hiring field executives for partner onboarding visits. Meet driver partners locally, complete verification steps, and support smooth joining across your city.",
  },
  {
    companyKey: "loadshare",
    category: "field",
    title: "Field Network Executive",
    slug: "loadshare-field-network-executive",
    salaryMin: 17000,
    salaryMax: 27000,
    incentiveMax: 3500,
    openings: 10,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Loadshare is hiring field network executives. Visit local partner points, support route readiness, and keep on-ground logistics coordination moving every day.",
  },
  {
    companyKey: "bigbasket",
    category: "field",
    title: "Store Field Executive",
    slug: "bigbasket-store-field-executive",
    salaryMin: 16000,
    salaryMax: 24000,
    incentiveMax: 3000,
    openings: 12,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Bigbasket is hiring store field executives for local site visits. Support store checks, coordinate with local teams, and complete assigned on-ground tasks on schedule.",
  },
  {
    companyKey: "blinkit",
    category: "field",
    title: "Dark Store Field Executive",
    slug: "blinkit-dark-store-field-executive",
    salaryMin: 16000,
    salaryMax: 25000,
    incentiveMax: 3000,
    openings: 14,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Blinkit is hiring field executives for dark-store visits. Support local store readiness, complete on-site checks, and help teams stay prepared for peak order windows.",
  },
  {
    companyKey: "everest-fleet",
    category: "field",
    title: "Fleet Field Executive",
    slug: "everest-fleet-field-executive",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 4000,
    openings: 8,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Everest Fleet is hiring field executives to support fleet partners on ground. Complete local visits, check vehicle readiness, and coordinate with the operations team.",
  },

  // Telecallers
  {
    companyKey: "gigkaro",
    category: "telecaller",
    title: "Hiring Support Telecaller",
    slug: "gigkaro-hiring-support-telecaller",
    salaryMin: 14000,
    salaryMax: 22000,
    incentiveMax: 4000,
    openings: 25,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "GigKaro is hiring telecallers to speak with candidates about open gigs. Call applicants, share role details, and guide them through the next hiring steps.",
  },
  {
    companyKey: "snabbit",
    category: "telecaller",
    title: "Customer Support Telecaller",
    slug: "snabbit-customer-support-telecaller",
    salaryMin: 15000,
    salaryMax: 24000,
    incentiveMax: 3500,
    openings: 18,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Snabbit is hiring customer support telecallers. Handle inbound and outbound calls, resolve simple queries, and keep customers updated on service bookings.",
  },
  {
    companyKey: "swiggy",
    category: "telecaller",
    title: "Partner Support Telecaller",
    slug: "swiggy-partner-support-telecaller",
    salaryMin: 15000,
    salaryMax: 25000,
    incentiveMax: 4000,
    openings: 20,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Swiggy is hiring partner support telecallers. Call delivery partners, answer joining and shift questions, and help them complete onboarding steps over the phone.",
  },
  {
    companyKey: "swiggy-instamart",
    category: "telecaller",
    title: "Recruitment Telecaller",
    slug: "instamart-recruitment-telecaller",
    salaryMin: 14000,
    salaryMax: 23000,
    incentiveMax: 3500,
    openings: 15,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Swiggy Instamart is hiring recruitment telecallers. Contact applicants for store and delivery roles, confirm interest, and schedule the next hiring conversation.",
  },
  {
    companyKey: "blinkit",
    category: "telecaller",
    title: "Candidate Calling Executive",
    slug: "blinkit-candidate-calling-executive",
    salaryMin: 14000,
    salaryMax: 22000,
    incentiveMax: 3500,
    openings: 16,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Blinkit is hiring candidate calling executives. Reach out to applicants for dark-store and delivery openings, share role basics, and push qualified leads to the next step.",
  },
  {
    companyKey: "zepto",
    category: "telecaller",
    title: "Outbound Telecaller",
    slug: "zepto-outbound-telecaller",
    salaryMin: 14000,
    salaryMax: 23000,
    incentiveMax: 4000,
    openings: 14,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Evening",
    description:
      "Zepto is hiring outbound telecallers for hiring support. Call interested candidates, explain open roles, and update outcomes in the partner tools after every conversation.",
  },
  {
    companyKey: "porter",
    category: "telecaller",
    title: "Driver Support Telecaller",
    slug: "porter-driver-support-telecaller",
    salaryMin: 15000,
    salaryMax: 24000,
    incentiveMax: 3500,
    openings: 12,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Porter is hiring telecallers for driver partner support. Handle calls about joining, documents and trip readiness, and guide partners through simple next steps.",
  },
  {
    companyKey: "bigbasket",
    category: "telecaller",
    title: "Hiring Desk Telecaller",
    slug: "bigbasket-hiring-desk-telecaller",
    salaryMin: 14000,
    salaryMax: 22000,
    incentiveMax: 3000,
    openings: 12,
    vehicle: "No vehicle required",
    employmentType: "Part-time",
    shift: "Morning",
    description:
      "Bigbasket is hiring desk telecallers for recruitment support. Call applicants for warehouse and delivery roles, confirm availability, and keep the hiring pipeline moving.",
  },
];

const baseRequirements = [
  "Must be at least 18 years old",
  "A smartphone with an active mobile number",
];

async function main() {
  await connectDb();
  let upserted = 0;
  const byCategory: Record<string, number> = {};
  for (const [index, role] of roles.entries()) {
    const company = await Company.findOne({ key: role.companyKey });
    if (!company || company.active === false) {
      console.warn(`Skip ${role.slug}: company ${role.companyKey} missing/inactive`);
      continue;
    }
    const extra =
      role.category === "telecaller"
        ? [
            "Clear spoken communication in Hindi or English",
            "Comfortable making outbound calls through a shift",
            "No vehicle or driving licence needed",
          ]
        : [
            "Basic familiarity with your local area",
            "Comfortable with on-site visits across the city",
            role.vehicle === "No vehicle required"
              ? "No vehicle or driving licence needed"
              : "Valid driving licence and vehicle documents",
          ];
    const payload = {
      jobKey: `${role.category}_${role.slug}`,
      slug: role.slug,
      title: role.title,
      company: company.name,
      companyId: company.key,
      initials: company.initials || company.name.slice(0, 2).toLowerCase(),
      color: company.color || "blue",
      category: role.category,
      city: seedLocation.city,
      locality: seedLocation.locality,
      pincode: seedLocation.pincode,
      lat: seedLocation.lat + index * 0.001,
      lng: seedLocation.lng + index * 0.001,
      distanceKm: 0,
      salaryMin: role.salaryMin,
      salaryMax: role.salaryMax,
      salaryType: "monthly" as const,
      incentiveMax: role.incentiveMax,
      openings: role.openings,
      immediateJoining: true,
      vehicle: role.vehicle,
      verified: true,
      employmentType: role.employmentType,
      shift: role.shift,
      postedAt: new Date().toISOString().slice(0, 10),
      description: role.description,
      requirements: [...baseRequirements, ...extra],
      status: "Active" as const,
      showEverywhere: true,
    };
    await Job.findOneAndUpdate(
      { $or: [{ slug: role.slug }, { jobKey: payload.jobKey }] },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    upserted += 1;
    byCategory[role.category] = (byCategory[role.category] || 0) + 1;
    console.log(`Upserted [${role.category}] ${role.title} @ ${company.name}`);
  }
  console.log(`Done. Upserted ${upserted} jobs.`, byCategory);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
