/**
 * Upserts warehouse & packer jobs for companies already listed on GigKaro.
 * Run: npx tsx scripts/seed-warehouse-jobs.ts
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
  employmentType: "Full-time" | "Part-time" | "Flexible";
  shift: "Morning" | "Evening" | "Night" | "Flexible";
  description: string;
};

const roles: RoleSeed[] = [
  {
    companyKey: "blinkit-picker-packer",
    title: "Warehouse Picker Packer",
    slug: "warehouse-picker-packer",
    salaryMin: 18000,
    salaryMax: 26000,
    incentiveMax: 4000,
    openings: 40,
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Join Blinkit's dark-store team as a picker packer. Pick grocery items accurately, pack orders for quick commerce delivery, and keep the store floor moving during busy hours.",
  },
  {
    companyKey: "blinkit",
    title: "Dark Store Associate",
    slug: "dark-store-associate",
    salaryMin: 17000,
    salaryMax: 25000,
    incentiveMax: 3500,
    openings: 30,
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Work inside a Blinkit dark store. Pick, pack and stage orders so riders can complete 10-minute deliveries. Ideal for candidates who prefer store-floor work over riding.",
  },
  {
    companyKey: "zepto",
    title: "Picker Packer",
    slug: "zepto-picker-packer",
    salaryMin: 18000,
    salaryMax: 27000,
    incentiveMax: 5000,
    openings: 35,
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Zepto is hiring picker packers for dark-store operations. Collect items from racks, pack grocery orders carefully, and meet quick-commerce SLAs with the floor team.",
  },
  {
    companyKey: "bigbasket",
    title: "Warehouse Associate",
    slug: "bigbasket-warehouse-associate",
    salaryMin: 16000,
    salaryMax: 24000,
    incentiveMax: 3000,
    openings: 25,
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Join Bigbasket's warehouse team. Handle picking, packing and inbound stocking for grocery orders with clear daily targets and supportive shift supervisors.",
  },
  {
    companyKey: "flipkart-minutes",
    title: "Dark Store Packer",
    slug: "flipkart-minutes-dark-store-packer",
    salaryMin: 18000,
    salaryMax: 26000,
    incentiveMax: 4000,
    openings: 28,
    employmentType: "Full-time",
    shift: "Evening",
    description:
      "Flipkart Minutes needs dark-store packers to pick and pack quick-commerce orders. Keep inventory tidy, pack accurately, and support riders with on-time handovers.",
  },
  {
    companyKey: "swiggy-instamart",
    title: "Instamart Store Packer",
    slug: "instamart-store-packer",
    salaryMin: 17000,
    salaryMax: 25000,
    incentiveMax: 4500,
    openings: 32,
    employmentType: "Part-time",
    shift: "Flexible",
    description:
      "Swiggy Instamart is hiring store packers for local dark stores. Pick grocery SKUs, pack bags for delivery partners, and keep the store ready for rush hours.",
  },
  {
    companyKey: "xpress-bees",
    title: "Sorting Hub Associate",
    slug: "xpress-bees-sorting-hub-associate",
    salaryMin: 15000,
    salaryMax: 22000,
    incentiveMax: 2500,
    openings: 20,
    employmentType: "Full-time",
    shift: "Night",
    description:
      "Xpress Bees is hiring sorting hub associates. Sort parcels by route, handle inbound bags carefully, and keep the hub organised through every shift.",
  },
  {
    companyKey: "pronto",
    title: "Warehouse Packer",
    slug: "pronto-warehouse-packer",
    salaryMin: 16000,
    salaryMax: 23000,
    incentiveMax: 3000,
    openings: 18,
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Pronto is hiring warehouse packers for local fulfilment. Pack orders accurately, support inventory checks, and work with the floor team on daily outbound targets.",
  },
  {
    companyKey: "zippee",
    title: "Hub Packer",
    slug: "zippee-hub-packer",
    salaryMin: 15000,
    salaryMax: 22000,
    incentiveMax: 2500,
    openings: 15,
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Join Zippee as a hub packer. Prepare parcels for last-mile partners, keep packing stations organised, and help the hub meet same-day dispatch targets.",
  },
];

const requirements = [
  "Must be at least 18 years old",
  "A smartphone with an active mobile number",
  "Comfortable standing and moving through a store or warehouse shift",
  "No vehicle or driving licence needed",
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
    const payload = {
      jobKey: `warehouse_${role.companyKey}`,
      slug: role.slug,
      title: role.title,
      company: company.name,
      companyId: company.key,
      initials: company.initials || company.name.slice(0, 2).toLowerCase(),
      color: company.color || "blue",
      category: "warehouse",
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
      vehicle: "No vehicle required" as const,
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
  console.log(`Done. Upserted ${upserted} warehouse jobs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
