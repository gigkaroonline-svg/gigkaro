/**
 * Upserts drivers & logistics jobs for companies already listed on GigKaro.
 * Run: npx tsx scripts/seed-logistics-jobs.ts
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
  requirements?: string[];
};

const roles: RoleSeed[] = [
  {
    companyKey: "porter",
    title: "Porter Driver Partner",
    slug: "porter-driver-partner",
    salaryMin: 25000,
    salaryMax: 40000,
    incentiveMax: 8000,
    openings: 30,
    vehicle: "Bike required",
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Porter is hiring driver partners for local and intra-city logistics. Complete pickups and drops across your city, manage consignments carefully, and earn with clear trip-based payouts.",
  },
  {
    companyKey: "loadshare",
    title: "Last Mile Rider",
    slug: "loadshare-last-mile-rider",
    salaryMin: 20000,
    salaryMax: 32000,
    incentiveMax: 5000,
    openings: 35,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Loadshare is hiring last-mile riders. Deliver parcels on assigned local routes, update delivery status on time, and keep customers informed when a drop needs extra support.",
  },
  {
    companyKey: "everest-fleet",
    title: "EV Fleet Driver",
    slug: "everest-fleet-ev-driver",
    salaryMin: 22000,
    salaryMax: 35000,
    incentiveMax: 6000,
    openings: 25,
    vehicle: "EV accepted",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Everest Fleet is hiring EV fleet drivers. Drive electric vehicles on assigned city routes, complete pickups and drops safely, and maintain trip discipline with the fleet team.",
  },
  {
    companyKey: "xpress-bees",
    title: "Last Mile Delivery Executive",
    slug: "xpress-bees-last-mile-executive",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 4000,
    openings: 40,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Xpress Bees is hiring last-mile delivery executives. Collect bags from the local hub, deliver parcels across your zone, and close deliveries with accurate POD updates.",
  },
  {
    companyKey: "zippee",
    title: "Hyperlocal Logistics Rider",
    slug: "zippee-hyperlocal-rider",
    salaryMin: 18000,
    salaryMax: 30000,
    incentiveMax: 4500,
    openings: 28,
    vehicle: "Bike required",
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Zippee is hiring hyperlocal logistics riders. Move time-sensitive parcels between hubs and customers, follow assigned routes, and keep every handover on schedule.",
  },
  {
    companyKey: "bigbasket",
    title: "Logistics Delivery Partner",
    slug: "bigbasket-logistics-delivery-partner",
    salaryMin: 20000,
    salaryMax: 32000,
    incentiveMax: 5000,
    openings: 22,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Bigbasket is hiring logistics delivery partners for grocery routes. Pick consignments from the local hub or store, deliver to customers safely, and complete daily route targets.",
  },
  {
    companyKey: "flipkart-minutes",
    title: "Route Delivery Associate",
    slug: "flipkart-minutes-route-delivery-associate",
    salaryMin: 20000,
    salaryMax: 30000,
    incentiveMax: 4000,
    openings: 20,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Evening",
    description:
      "Flipkart Minutes is hiring route delivery associates. Cover assigned quick-commerce zones, deliver orders on time, and coordinate with the dark-store team for smooth handovers.",
  },
  {
    companyKey: "pronto",
    title: "City Logistics Rider",
    slug: "pronto-city-logistics-rider",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 3500,
    openings: 18,
    vehicle: "Bike required",
    employmentType: "Part-time",
    shift: "Flexible",
    description:
      "Pronto is hiring city logistics riders. Complete local pickups and drops, handle packages carefully, and use the partner app to manage daily trips and earnings.",
  },
];

const baseRequirements = [
  "Must be at least 18 years old",
  "A smartphone with an active mobile number",
  "Basic familiarity with your local area",
];

async function main() {
  await connectDb();
  let upserted = 0;
  for (const [index, role] of roles.entries()) {
    const company = await Company.findOne({ key: role.companyKey });
    if (!company || company.active === false) {
      console.warn(`Skip ${role.slug}: company ${role.companyKey} missing/inactive`);
      continue;
    }
    const requirements = [
      ...baseRequirements,
      role.vehicle === "No vehicle required"
        ? "No vehicle or driving licence needed"
        : role.vehicle === "EV accepted"
          ? "Valid licence; EV preferred or provided as per fleet policy"
          : "Valid driving licence and vehicle documents",
    ];
    const payload = {
      jobKey: `logistics_${role.companyKey}`,
      slug: role.slug,
      title: role.title,
      company: company.name,
      companyId: company.key,
      initials: company.initials || company.name.slice(0, 2).toLowerCase(),
      color: company.color || "blue",
      category: "logistics",
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
      requirements,
      status: "Active" as const,
      showEverywhere: true,
    };
    await Job.findOneAndUpdate(
      { $or: [{ slug: role.slug }, { jobKey: payload.jobKey }] },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    upserted += 1;
    console.log(`Upserted ${role.title} @ ${company.name}`);
  }
  console.log(`Done. Upserted ${upserted} logistics jobs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
