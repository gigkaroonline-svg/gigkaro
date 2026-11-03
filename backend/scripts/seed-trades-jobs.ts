/**
 * Upserts technician, electrician-plumber, and maintenance jobs
 * for companies already listed on GigKaro.
 * Run: npx tsx scripts/seed-trades-jobs.ts
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
  category: "technician" | "electrician-plumber" | "maintenance";
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
  // Technicians
  {
    companyKey: "everest-fleet",
    category: "technician",
    title: "EV Fleet Technician",
    slug: "everest-fleet-ev-technician",
    salaryMin: 22000,
    salaryMax: 35000,
    incentiveMax: 5000,
    openings: 12,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Everest Fleet is hiring EV technicians to inspect, service and troubleshoot electric fleet vehicles. Keep chargers and on-vehicle systems running so drivers stay on route.",
  },
  {
    companyKey: "porter",
    category: "technician",
    title: "Vehicle Service Technician",
    slug: "porter-vehicle-service-technician",
    salaryMin: 20000,
    salaryMax: 32000,
    incentiveMax: 4000,
    openings: 10,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Porter is hiring vehicle service technicians. Diagnose routine partner-vehicle issues, complete basic repairs, and keep logistics vehicles ready for daily trips.",
  },
  {
    companyKey: "xpress-bees",
    category: "technician",
    title: "Hub Equipment Technician",
    slug: "xpress-bees-hub-equipment-technician",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 3000,
    openings: 8,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Xpress Bees needs hub equipment technicians to install, repair and service sorting and packing equipment so parcels keep moving through the hub.",
  },
  {
    companyKey: "blinkit",
    category: "technician",
    title: "Dark Store Equipment Technician",
    slug: "blinkit-dark-store-technician",
    salaryMin: 18000,
    salaryMax: 27000,
    incentiveMax: 3500,
    openings: 10,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Blinkit is hiring technicians for dark-store equipment. Service cold units, scanners and packing gear across local stores and restore downtime quickly.",
  },
  {
    companyKey: "zepto",
    category: "technician",
    title: "Store Technician",
    slug: "zepto-store-technician",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 3500,
    openings: 9,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Zepto is hiring store technicians to repair and maintain dark-store equipment. Handle on-site service visits, fix basic faults, and keep stores ready for peak hours.",
  },
  {
    companyKey: "snabbit",
    category: "technician",
    title: "Home Appliance Technician",
    slug: "snabbit-home-appliance-technician",
    salaryMin: 20000,
    salaryMax: 32000,
    incentiveMax: 4500,
    openings: 15,
    vehicle: "Bike required",
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Snabbit is hiring home appliance technicians for on-site installs and repairs. Visit customer homes, diagnose common appliance issues, and complete service jobs professionally.",
  },
  {
    companyKey: "gigkaro",
    category: "technician",
    title: "Field Service Technician",
    slug: "gigkaro-field-service-technician",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 3000,
    openings: 12,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "GigKaro is hiring field service technicians for partner sites. Install, repair and service equipment across local locations with clear daily job cards and support.",
  },

  // Electricians & Plumbers
  {
    companyKey: "snabbit",
    category: "electrician-plumber",
    title: "Electrician",
    slug: "snabbit-electrician",
    salaryMin: 20000,
    salaryMax: 35000,
    incentiveMax: 5000,
    openings: 18,
    vehicle: "Bike required",
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Snabbit is hiring electricians for residential and small commercial jobs. Handle wiring, fittings, switches and basic repairs with neat workmanship and clear customer communication.",
  },
  {
    companyKey: "snabbit",
    category: "electrician-plumber",
    title: "Plumber",
    slug: "snabbit-plumber",
    salaryMin: 18000,
    salaryMax: 32000,
    incentiveMax: 4500,
    openings: 16,
    vehicle: "Bike required",
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Snabbit is hiring plumbers for local service jobs. Fix leaks, fittings and drainage issues in homes and small spaces, and complete visits with tidy, reliable work.",
  },
  {
    companyKey: "gigkaro",
    category: "electrician-plumber",
    title: "Site Electrician",
    slug: "gigkaro-site-electrician",
    salaryMin: 18000,
    salaryMax: 30000,
    incentiveMax: 3500,
    openings: 10,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "GigKaro is hiring site electricians for partner facilities. Complete wiring, fittings and electrical repairs across local sites with safety-first practices.",
  },
  {
    companyKey: "bigbasket",
    category: "electrician-plumber",
    title: "Facility Electrician",
    slug: "bigbasket-facility-electrician",
    salaryMin: 18000,
    salaryMax: 28000,
    incentiveMax: 3000,
    openings: 8,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Bigbasket is hiring facility electricians for warehouse and store sites. Maintain electrical fittings, fix basic faults, and keep operations running safely through every shift.",
  },
  {
    companyKey: "xpress-bees",
    category: "electrician-plumber",
    title: "Hub Electrician",
    slug: "xpress-bees-hub-electrician",
    salaryMin: 17000,
    salaryMax: 26000,
    incentiveMax: 2500,
    openings: 6,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Night",
    description:
      "Xpress Bees needs hub electricians to maintain lighting, panels and basic electrical fittings so night sorting operations stay uninterrupted.",
  },
  {
    companyKey: "swiggy-instamart",
    category: "electrician-plumber",
    title: "Store Electrician Plumber",
    slug: "instamart-store-electrician-plumber",
    salaryMin: 18000,
    salaryMax: 27000,
    incentiveMax: 3000,
    openings: 8,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Swiggy Instamart is hiring multi-skill electrician-plumbers for dark stores. Handle fittings, minor plumbing and electrical fixes so stores stay open and safe.",
  },
  {
    companyKey: "blinkit",
    category: "electrician-plumber",
    title: "Facility Plumber",
    slug: "blinkit-facility-plumber",
    salaryMin: 16000,
    salaryMax: 25000,
    incentiveMax: 2500,
    openings: 7,
    vehicle: "Bike required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Blinkit is hiring facility plumbers for dark-store sites. Fix leaks, drainage and fittings quickly so store operations are not disrupted.",
  },

  // Service & Maintenance
  {
    companyKey: "snabbit",
    category: "maintenance",
    title: "Home Maintenance Worker",
    slug: "snabbit-home-maintenance-worker",
    salaryMin: 15000,
    salaryMax: 25000,
    incentiveMax: 3000,
    openings: 20,
    vehicle: "No vehicle required",
    employmentType: "Flexible",
    shift: "Flexible",
    description:
      "Snabbit is hiring home maintenance workers for cleaning, upkeep and basic household service jobs. Complete assigned visits on time with reliable, courteous work.",
  },
  {
    companyKey: "bigbasket",
    category: "maintenance",
    title: "Warehouse Maintenance Associate",
    slug: "bigbasket-warehouse-maintenance",
    salaryMin: 15000,
    salaryMax: 22000,
    incentiveMax: 2500,
    openings: 12,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Bigbasket is hiring warehouse maintenance associates to keep floors, racks and common areas clean and operational through every shift.",
  },
  {
    companyKey: "blinkit",
    category: "maintenance",
    title: "Dark Store Maintenance Associate",
    slug: "blinkit-dark-store-maintenance",
    salaryMin: 14000,
    salaryMax: 21000,
    incentiveMax: 2000,
    openings: 14,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Flexible",
    description:
      "Blinkit is hiring dark-store maintenance associates. Keep stores clean, organised and ready for peak hours while supporting basic facility upkeep.",
  },
  {
    companyKey: "zepto",
    category: "maintenance",
    title: "Store Facility Associate",
    slug: "zepto-store-facility-associate",
    salaryMin: 14000,
    salaryMax: 22000,
    incentiveMax: 2500,
    openings: 12,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "Zepto is hiring store facility associates for day-to-day maintenance. Support cleaning, basic upkeep and floor readiness across local dark stores.",
  },
  {
    companyKey: "flipkart-minutes",
    category: "maintenance",
    title: "Facility Maintenance Associate",
    slug: "flipkart-minutes-facility-maintenance",
    salaryMin: 15000,
    salaryMax: 23000,
    incentiveMax: 2500,
    openings: 10,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Evening",
    description:
      "Flipkart Minutes is hiring facility maintenance associates for dark-store sites. Keep work areas clean, report issues early, and support smooth shift handovers.",
  },
  {
    companyKey: "xpress-bees",
    category: "maintenance",
    title: "Hub Maintenance Associate",
    slug: "xpress-bees-hub-maintenance",
    salaryMin: 14000,
    salaryMax: 20000,
    incentiveMax: 2000,
    openings: 10,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Night",
    description:
      "Xpress Bees is hiring hub maintenance associates. Keep sorting floors tidy, support basic facility checks, and help the hub stay safe through night operations.",
  },
  {
    companyKey: "swiggy-instamart",
    category: "maintenance",
    title: "Instamart Facility Associate",
    slug: "instamart-facility-associate",
    salaryMin: 14000,
    salaryMax: 21000,
    incentiveMax: 2000,
    openings: 11,
    vehicle: "No vehicle required",
    employmentType: "Part-time",
    shift: "Flexible",
    description:
      "Swiggy Instamart is hiring facility associates for store upkeep. Maintain clean floors and packing areas so dark stores stay ready for busy order windows.",
  },
  {
    companyKey: "gigkaro",
    category: "maintenance",
    title: "Facility Maintenance Worker",
    slug: "gigkaro-facility-maintenance-worker",
    salaryMin: 15000,
    salaryMax: 23000,
    incentiveMax: 2500,
    openings: 15,
    vehicle: "No vehicle required",
    employmentType: "Full-time",
    shift: "Morning",
    description:
      "GigKaro is hiring facility maintenance workers for partner sites. Handle cleaning, basic upkeep and day-to-day facility checks with clear shift routines.",
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
  const byCategory: Record<string, number> = {};
  for (const [index, role] of roles.entries()) {
    const company = await Company.findOne({ key: role.companyKey });
    if (!company || company.active === false) {
      console.warn(`Skip ${role.slug}: company ${role.companyKey} missing/inactive`);
      continue;
    }
    const tradeBit =
      role.category === "technician"
        ? "Relevant hands-on experience with equipment service or installs preferred"
        : role.category === "electrician-plumber"
          ? "Prior electrician or plumber experience preferred; tools as required for the job"
          : "Comfortable with physical facility or household upkeep work";
    const requirements = [
      ...baseRequirements,
      tradeBit,
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
