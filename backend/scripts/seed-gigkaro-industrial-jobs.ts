/**
 * Upserts 15 GigKaro jobs each for machine-operator, factory,
 * fitter-welder, and construction.
 * Run: npx tsx scripts/seed-gigkaro-industrial-jobs.ts
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

type Category =
  | "machine-operator"
  | "factory"
  | "fitter-welder"
  | "construction";

type RoleSeed = {
  category: Category;
  title: string;
  slug: string;
  salaryMin: number;
  salaryMax: number;
  incentiveMax: number;
  openings: number;
  employmentType: "Full-time" | "Part-time" | "Flexible";
  shift: "Morning" | "Evening" | "Night" | "Flexible";
  description: string;
  skill: string;
};

const employmentCycle = ["Full-time", "Full-time", "Part-time", "Flexible"] as const;
const shiftCycle = ["Morning", "Evening", "Night", "Flexible"] as const;

function role(
  category: Category,
  title: string,
  slug: string,
  pay: [number, number],
  skill: string,
  blurb: string,
  index: number,
): RoleSeed {
  return {
    category,
    title,
    slug,
    salaryMin: pay[0],
    salaryMax: pay[1],
    incentiveMax: 1500 + (index % 5) * 500,
    openings: 8 + (index % 7) * 3,
    employmentType: employmentCycle[index % employmentCycle.length],
    shift: shiftCycle[index % shiftCycle.length],
    description: `GigKaro is hiring ${title.toLowerCase()}s for partner sites. ${blurb}`,
    skill,
  };
}

const roles: RoleSeed[] = [
  // Machine Operators (15)
  role("machine-operator", "CNC Machine Operator", "gigkaro-cnc-machine-operator", [18000, 28000], "Comfortable operating CNC or similar shop-floor machines", "Run assigned CNC machines safely and keep output quality consistent through every shift.", 0),
  role("machine-operator", "Packaging Machine Operator", "gigkaro-packaging-machine-operator", [15000, 23000], "Able to follow packaging machine routines through a full shift", "Run packing lines, monitor basic checks, and keep finished goods moving to daily targets.", 1),
  role("machine-operator", "Production Machine Operator", "gigkaro-production-machine-operator", [16000, 25000], "Basic machine handling experience preferred", "Operate production machines, report faults early, and support steady line output.", 2),
  role("machine-operator", "Lathe Machine Operator", "gigkaro-lathe-machine-operator", [17000, 27000], "Lathe or turning experience preferred", "Handle lathe operations, follow job cards, and maintain dimensional accuracy on parts.", 3),
  role("machine-operator", "Press Machine Operator", "gigkaro-press-machine-operator", [15000, 24000], "Comfortable with press or stamping machine routines", "Operate press machines safely, complete batch targets, and keep the station organised.", 4),
  role("machine-operator", "Injection Moulding Operator", "gigkaro-injection-moulding-operator", [16000, 26000], "Plastic moulding or machine shop exposure preferred", "Run moulding machines, check basic quality, and support continuous production cycles.", 5),
  role("machine-operator", "Printing Machine Operator", "gigkaro-printing-machine-operator", [15000, 24000], "Able to follow print machine setup and quality checks", "Operate printing machines for packaging or labels and keep runs consistent.", 6),
  role("machine-operator", "Cutting Machine Operator", "gigkaro-cutting-machine-operator", [15000, 23000], "Comfortable with cutting or shearing equipment", "Run cutting machines to size, follow safety rules, and prepare material for the next stage.", 7),
  role("machine-operator", "Sewing Machine Operator", "gigkaro-sewing-machine-operator", [14000, 22000], "Industrial sewing machine experience preferred", "Operate industrial sewing machines on production lines with neat, consistent stitching.", 8),
  role("machine-operator", "Boiler Operator Helper", "gigkaro-boiler-operator-helper", [16000, 25000], "Willing to learn boiler-room routines under supervision", "Support boiler and utility machine checks while following strict safety procedures.", 9),
  role("machine-operator", "Conveyor Line Operator", "gigkaro-conveyor-line-operator", [14000, 21000], "Able to monitor moving lines and clear jams safely", "Keep conveyor lines running, clear stoppages quickly, and support continuous flow.", 10),
  role("machine-operator", "Grinding Machine Operator", "gigkaro-grinding-machine-operator", [16000, 25000], "Grinding or finishing machine exposure preferred", "Operate grinding machines for finishing work and maintain clean, accurate surfaces.", 11),
  role("machine-operator", "Drill Machine Operator", "gigkaro-drill-machine-operator", [15000, 23000], "Basic drilling or fabrication shop experience preferred", "Complete drilling jobs to mark, keep tools ready, and support fabrication throughput.", 12),
  role("machine-operator", "VMC Machine Operator", "gigkaro-vmc-machine-operator", [19000, 30000], "VMC or CNC machining experience preferred", "Run VMC machines for precision parts and maintain cycle times with quality checks.", 13),
  role("machine-operator", "Power Press Operator", "gigkaro-power-press-operator", [15000, 24000], "Power press safety training preferred", "Operate power press machines carefully and meet batch targets without quality slips.", 14),

  // Factory (15)
  role("factory", "Factory Worker", "gigkaro-factory-worker", [14000, 22000], "Comfortable with physical shop-floor work", "Support line tasks, keep stations organised, and complete assigned output every shift.", 0),
  role("factory", "Production Line Associate", "gigkaro-production-line-associate", [15000, 23000], "Able to follow standard operating steps on a line", "Assemble, pack or finish goods on the line and keep daily targets on track.", 1),
  role("factory", "Assembly Line Worker", "gigkaro-assembly-line-worker", [14000, 21000], "Good hand coordination for assembly tasks", "Complete assembly tasks accurately and support smooth handovers between shifts.", 2),
  role("factory", "Packing Associate", "gigkaro-packing-associate", [13000, 20000], "Able to pack goods quickly and carefully", "Pack finished goods, label cartons, and prepare outbound batches for dispatch.", 3),
  role("factory", "Quality Check Associate", "gigkaro-quality-check-associate", [15000, 23000], "Attention to detail for visual and basic checks", "Inspect line output, flag defects early, and help maintain quality standards.", 4),
  role("factory", "Material Handling Worker", "gigkaro-material-handling-worker", [14000, 21000], "Comfortable moving materials across the floor", "Move raw materials and finished goods between stations to keep production flowing.", 5),
  role("factory", "Shop Floor Helper", "gigkaro-shop-floor-helper", [12000, 18000], "Willing to support multiple floor tasks", "Assist operators with loading, cleanup and basic production support through the shift.", 6),
  role("factory", "Finishing Line Worker", "gigkaro-finishing-line-worker", [14000, 21000], "Able to complete finishing and polishing steps", "Handle finishing tasks so products leave the line ready for packing or dispatch.", 7),
  role("factory", "Store Keeper Helper", "gigkaro-store-keeper-helper", [14000, 21000], "Basic counting and organisation skills", "Support factory stores with issue, receipt and binning of production materials.", 8),
  role("factory", "Production Helper", "gigkaro-production-helper", [12000, 19000], "Ready for standing physical work on the floor", "Support operators with tools, material and cleanup so the line stays uninterrupted.", 9),
  role("factory", "Batching Associate", "gigkaro-batching-associate", [14000, 22000], "Able to follow batch recipes or quantity cards", "Prepare and issue production batches accurately according to daily plans.", 10),
  role("factory", "Loading Unloading Worker", "gigkaro-loading-unloading-worker", [13000, 20000], "Comfortable with loading bay physical work", "Load and unload materials at the factory dock and keep the bay clear and organised.", 11),
  role("factory", "Line Feeder", "gigkaro-line-feeder", [13000, 19000], "Able to keep machines fed without gaps", "Feed materials to machines and packing stations so production does not stall.", 12),
  role("factory", "Housekeeping Production Associate", "gigkaro-housekeeping-production-associate", [12000, 18000], "Able to keep industrial floors clean and safe", "Keep production areas clean, remove scrap, and support a safe shop-floor environment.", 13),
  role("factory", "Night Shift Factory Worker", "gigkaro-night-shift-factory-worker", [15000, 23000], "Willing to work night or rotating shifts", "Cover night production support tasks and keep assigned stations running till handover.", 14),

  // Fitters & Welders (15)
  role("fitter-welder", "Welder", "gigkaro-welder", [20000, 32000], "Hands-on welding experience preferred", "Complete welding jobs to specification and keep joints clean and reliable.", 0),
  role("fitter-welder", "Fitter", "gigkaro-fitter", [18000, 28000], "Basic fitting tools experience preferred", "Measure, align and assemble parts accurately for equipment and structures.", 1),
  role("fitter-welder", "Fabrication Fitter Welder", "gigkaro-fabrication-fitter-welder", [19000, 30000], "Experience in fitting and/or welding preferred", "Handle combined fitting and welding tasks with neat, safety-first workmanship.", 2),
  role("fitter-welder", "MIG Welder", "gigkaro-mig-welder", [20000, 33000], "MIG welding experience preferred", "Complete MIG welding on fabrication jobs and maintain weld quality through the shift.", 3),
  role("fitter-welder", "TIG Welder", "gigkaro-tig-welder", [22000, 35000], "TIG welding experience preferred", "Perform TIG welding on precision jobs with clean finishes and strict safety practice.", 4),
  role("fitter-welder", "Arc Welder", "gigkaro-arc-welder", [18000, 29000], "Arc welding experience preferred", "Handle arc welding tasks on site or in the workshop according to job cards.", 5),
  role("fitter-welder", "Pipe Fitter", "gigkaro-pipe-fitter", [19000, 30000], "Pipe fitting experience preferred", "Fit and align pipes for industrial or site jobs with accurate measurements.", 6),
  role("fitter-welder", "Structural Fitter", "gigkaro-structural-fitter", [19000, 30000], "Structural fabrication exposure preferred", "Assemble structural members and prepare frames for welding or installation.", 7),
  role("fitter-welder", "Bench Fitter", "gigkaro-bench-fitter", [17000, 26000], "Bench tools and filing experience preferred", "Complete bench fitting, filing and assembly work for components and fixtures.", 8),
  role("fitter-welder", "Fabrication Helper", "gigkaro-fabrication-helper", [14000, 21000], "Willing to assist welders and fitters on the floor", "Support fabrication teams with material prep, clamping and cleanup.", 9),
  role("fitter-welder", "Site Welder", "gigkaro-site-welder", [20000, 32000], "Comfortable welding on active work sites", "Complete on-site welding jobs safely and coordinate with the site supervisor.", 10),
  role("fitter-welder", "Gas Cutter", "gigkaro-gas-cutter", [16000, 25000], "Gas cutting experience preferred", "Cut plates and sections to mark and prepare material for fabrication.", 11),
  role("fitter-welder", "Sheet Metal Fitter", "gigkaro-sheet-metal-fitter", [17000, 27000], "Sheet metal work experience preferred", "Fit and assemble sheet metal parts for ducts, panels and light fabrication.", 12),
  role("fitter-welder", "Maintenance Fitter", "gigkaro-maintenance-fitter", [18000, 28000], "Mechanical fitting for maintenance preferred", "Support breakdown fitting jobs and keep plant equipment aligned and running.", 13),
  role("fitter-welder", "Workshop Welder Fitter", "gigkaro-workshop-welder-fitter", [18000, 29000], "Workshop fabrication experience preferred", "Handle mixed welder-fitter tasks inside the workshop across daily job cards.", 14),

  // Construction (15)
  role("construction", "Construction Helper", "gigkaro-construction-helper", [12000, 20000], "Comfortable with outdoor physical site work", "Support skilled workers with material movement, cleanup and basic labour tasks.", 0),
  role("construction", "Site Labourer", "gigkaro-site-labourer", [13000, 21000], "Able to work long site days", "Handle loading, unloading and general site support so building work stays on schedule.", 1),
  role("construction", "Mason Helper", "gigkaro-mason-helper", [14000, 22000], "Prior helper experience on masonry sites preferred", "Assist masons with material prep, mixing support and finishing cleanup.", 2),
  role("construction", "Shuttering Carpenter Helper", "gigkaro-shuttering-carpenter-helper", [14000, 22000], "Willing to assist shuttering carpenters", "Support formwork setup, material handling and site cleanup for shuttering jobs.", 3),
  role("construction", "Bar Bending Helper", "gigkaro-bar-bending-helper", [14000, 22000], "Comfortable handling steel bars under supervision", "Help with cutting, shifting and placing reinforcement steel on civil sites.", 4),
  role("construction", "Scaffolding Helper", "gigkaro-scaffolding-helper", [14000, 23000], "Comfortable working at height with PPE", "Assist scaffolding crews with erection, dismantling and material movement.", 5),
  role("construction", "Painting Helper", "gigkaro-painting-helper", [13000, 20000], "Able to support surface prep and painting crews", "Prepare surfaces, move materials and support painters through site finishing jobs.", 6),
  role("construction", "Tile Helper", "gigkaro-tile-helper", [13000, 21000], "Willing to assist tiling teams", "Support tile cutting, material prep and cleanup for flooring and wall jobs.", 7),
  role("construction", "Plumbing Helper Site", "gigkaro-plumbing-helper-site", [14000, 22000], "Able to assist site plumbers", "Support plumbing crews with material movement, chasing cleanup and fittings prep.", 8),
  role("construction", "Electrical Helper Site", "gigkaro-electrical-helper-site", [14000, 22000], "Able to assist site electricians safely", "Support electrical crews with conduit prep, material handling and site cleanup.", 9),
  role("construction", "Concrete Helper", "gigkaro-concrete-helper", [13000, 21000], "Comfortable with pouring and finishing support work", "Assist during concrete pours with material supply, vibration support and cleanup.", 10),
  role("construction", "Demolition Helper", "gigkaro-demolition-helper", [14000, 23000], "Comfortable with dusty physical demolition support", "Support controlled demolition crews with debris handling and site clearing.", 11),
  role("construction", "Road Work Labourer", "gigkaro-road-work-labourer", [13000, 21000], "Able to work outdoors on road or civil packages", "Support road and civil packages with digging, material movement and site readiness.", 12),
  role("construction", "Site Cleaning Labourer", "gigkaro-site-cleaning-labourer", [12000, 18000], "Able to keep active sites clear and safe", "Clear debris, organise materials and keep construction zones ready for the next trade.", 13),
  role("construction", "Contract Site Worker", "gigkaro-contract-site-worker", [13000, 21000], "Available for daily wage or short contract site work", "Take up general construction support work across partner sites as daily or contract labour.", 14),
];

const baseRequirements = [
  "Must be at least 18 years old",
  "A smartphone with an active mobile number",
  "No vehicle or driving licence needed",
];

async function main() {
  await connectDb();
  const company = await Company.findOne({ key: "gigkaro" });
  if (!company || company.active === false) {
    throw new Error("GigKaro company missing or inactive.");
  }

  let upserted = 0;
  const byCategory: Record<string, number> = {};
  for (const [index, roleItem] of roles.entries()) {
    const payload = {
      jobKey: `gigkaro_${roleItem.category}_${roleItem.slug}`,
      slug: roleItem.slug,
      title: roleItem.title,
      company: company.name,
      companyId: company.key,
      initials: company.initials || "gi",
      color: company.color || "blue",
      category: roleItem.category,
      city: seedLocation.city,
      locality: seedLocation.locality,
      pincode: seedLocation.pincode,
      lat: seedLocation.lat + index * 0.001,
      lng: seedLocation.lng + index * 0.001,
      distanceKm: 0,
      salaryMin: roleItem.salaryMin,
      salaryMax: roleItem.salaryMax,
      salaryType: "monthly" as const,
      incentiveMax: roleItem.incentiveMax,
      openings: roleItem.openings,
      immediateJoining: true,
      vehicle: "No vehicle required" as const,
      verified: true,
      employmentType: roleItem.employmentType,
      shift: roleItem.shift,
      postedAt: new Date().toISOString().slice(0, 10),
      description: roleItem.description,
      requirements: [...baseRequirements, roleItem.skill],
      status: "Active" as const,
      showEverywhere: true,
    };
    await Job.findOneAndUpdate(
      { $or: [{ slug: roleItem.slug }, { jobKey: payload.jobKey }] },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    upserted += 1;
    byCategory[roleItem.category] = (byCategory[roleItem.category] || 0) + 1;
    console.log(`Upserted [${roleItem.category}] ${roleItem.title}`);
  }
  console.log(`Done. Upserted ${upserted} GigKaro jobs.`, byCategory);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
