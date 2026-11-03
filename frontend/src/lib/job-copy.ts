/** Place-aware copy shared by the job page and JobPosting description. */

export type JobCopyInput = {
  title: string;
  company: string;
  description?: string;
  locality?: string;
  city?: string;
  pincode?: string;
  employmentType?: string;
  shift?: string;
  vehicle?: string;
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  incentiveMax?: number;
};

export type JobOverviewFact = { label: string; value: string };

export type JobOverviewContent = {
  overview: string;
  facts: JobOverviewFact[];
  responsibilities: string[];
  howToApply: string;
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function jobPlaceLabel(job: {
  locality?: string;
  city?: string;
  pincode?: string;
}) {
  return [job.locality, job.city].filter(Boolean).join(", ") || job.pincode || "";
}

function isGenericDescription(body: string) {
  return (
    !body ||
    body.length < 40 ||
    /^join this role and start earning/i.test(body)
  );
}

function formatPay(min?: number, max?: number) {
  if (!min && !max) return "";
  const low = Math.min(min || max || 0, max || min || 0);
  const high = Math.max(min || 0, max || 0);
  if (!high) return "";
  if (low === high) return `₹${low.toLocaleString("en-IN")}`;
  return `₹${low.toLocaleString("en-IN")} and ₹${high.toLocaleString("en-IN")}`;
}

function areaLabel(job: JobCopyInput) {
  const locality = (job.locality || "").trim();
  const city = (job.city || "").trim();
  if (locality && city && locality.toLowerCase() !== city.toLowerCase()) {
    return `${locality} area in ${city}`;
  }
  return locality || city || "your local area";
}

function areaZonesLabel(job: JobCopyInput) {
  const locality = (job.locality || "").trim();
  const city = (job.city || "").trim();
  const category = (job.category || "").toLowerCase();
  const zoneWord =
    category === "warehouse" ||
    category === "factory" ||
    category === "machine-operator"
      ? "work area"
      : category === "telecaller"
        ? "hiring desk"
        : category === "construction" || category === "fitter-welder"
          ? "work sites"
          : category === "technician" ||
              category === "electrician-plumber" ||
              category === "maintenance" ||
              category === "field"
            ? "service area"
            : "delivery zones";
  if (locality) {
    return city && locality.toLowerCase() !== city.toLowerCase()
      ? `${locality} ${zoneWord}, ${city}`
      : `${locality} ${zoneWord}`;
  }
  if (city) return `${city} local area`;
  return `Local ${zoneWord}`;
}

function jobTypeLabel(job: JobCopyInput) {
  const category = (job.category || "").toLowerCase();
  const employment = job.employmentType || "Flexible";
  if (category === "telecaller") return `${employment} desk job`;
  if (
    category === "warehouse" ||
    category === "factory" ||
    category === "machine-operator"
  ) {
    return `${employment} facility job`;
  }
  if (
    [
      "delivery",
      "food",
      "commerce",
      "logistics",
      "field",
      "technician",
      "electrician-plumber",
      "maintenance",
      "construction",
      "fitter-welder",
    ].includes(category)
  ) {
    return `${employment} field job`;
  }
  return `${employment} job`;
}

function roleAction(job: JobCopyInput) {
  const category = (job.category || "").toLowerCase();
  const title = (job.title || "").toLowerCase();
  if (
    category === "delivery" ||
    category === "food" ||
    category === "commerce" ||
    title.includes("delivery")
  ) {
    return "collect orders from nearby stores or hubs and complete quick deliveries within local zones";
  }
  if (category === "warehouse") {
    return "handle pick, pack and floor tasks at the local facility and keep orders moving on time";
  }
  if (category === "factory" || category === "machine-operator") {
    return "run assigned production tasks on the shop floor and keep line output moving on time";
  }
  if (category === "logistics") {
    return "move consignments across local routes and complete on-time pickups and drops";
  }
  if (category === "telecaller") {
    return "handle outbound or support calls, follow scripts, and update outcomes after every conversation";
  }
  if (category === "technician") {
    return "install, repair and service equipment during on-site or facility visits";
  }
  if (category === "electrician-plumber") {
    return "complete wiring, fittings and repair jobs at assigned local sites";
  }
  if (category === "maintenance") {
    return "keep facilities clean, organised and ready through regular upkeep tasks";
  }
  if (category === "field") {
    return "complete on-site visits across your local area and close assigned field tasks";
  }
  if (category === "fitter-welder") {
    return "complete fitting and welding jobs to specification with safety-first workmanship";
  }
  if (category === "construction") {
    return "support build-site labour, material movement and day-to-day construction tasks";
  }
  return "complete assigned work for this role and coordinate with the local team";
}

function responsibilitiesFor(
  job: JobCopyInput,
  role: string,
  company: string,
  place: string,
  zone: string,
  cityBit: string,
) {
  const category = (job.category || "").toLowerCase();
  const title = role.toLowerCase();

  if (
    category === "delivery" ||
    category === "food" ||
    category === "commerce" ||
    title.includes("delivery")
  ) {
    return [
      `Pick up orders from nearby stores or hubs around ${zone}${cityBit}.`,
      `Deliver orders safely within expected time across ${zone} zones.`,
      `Use GPS navigation to locate customer addresses near ${zone}.`,
      `Handle packages carefully throughout every delivery for ${company}.`,
      `Provide courteous and professional customer service on each drop.`,
    ];
  }

  if (category === "warehouse") {
    return [
      `Pick and pack orders accurately at the ${company} facility near ${zone}.`,
      `Keep inventory racks organised through each shift.`,
      `Follow safety guidelines while handling goods and equipment.`,
      `Coordinate with supervisors to meet daily pick targets on time.`,
      `Stage packed orders so riders and dispatch teams can move quickly.`,
    ];
  }

  if (category === "factory") {
    return [
      `Complete assigned production-line tasks at the ${company} site near ${zone}.`,
      `Follow standard operating steps for assembly, packing or finishing work.`,
      `Keep your station clean and ready for the next batch or shift.`,
      `Meet daily output targets while maintaining basic quality checks.`,
      `Coordinate with supervisors when materials or line flow need support.`,
    ];
  }

  if (category === "machine-operator") {
    return [
      `Operate assigned machines safely according to job cards at the ${company} site.`,
      `Monitor basic machine checks and report faults early.`,
      `Keep output quality consistent through every production cycle.`,
      `Follow PPE and shop-floor safety rules at all times.`,
      `Hand over cleanly at shift change with clear status updates.`,
    ];
  }

  if (category === "logistics") {
    return [
      `Complete pickups and drops across routes near ${zone}${cityBit}.`,
      `Handle consignments carefully and update delivery status on time.`,
      `Follow assigned routes and safety guidelines for every trip.`,
      `Coordinate with the ${company} dispatch team when plans change.`,
      `Provide clear updates when a delivery needs extra support.`,
    ];
  }

  if (category === "telecaller") {
    return [
      `Call candidates or customers from the ${company} hiring or support desk${place ? ` covering ${place}` : ""}.`,
      `Share clear role or service details and answer basic questions professionally.`,
      `Follow the approved script and keep conversations polite and concise.`,
      `Update call outcomes, interest and next steps in the tracking tools.`,
      `Help move qualified leads to the next hiring or support stage on time.`,
    ];
  }

  if (category === "technician") {
    return [
      `Complete install, repair and service visits for ${company} around ${zone}${cityBit}.`,
      `Diagnose common equipment issues and restore working condition where possible.`,
      `Carry required tools and follow safety steps on every job.`,
      `Update job status after each visit so the operations team stays informed.`,
      `Represent ${company} professionally with site staff and customers.`,
    ];
  }

  if (category === "electrician-plumber") {
    return [
      `Handle wiring, fittings or plumbing repair jobs for ${company} near ${zone}.`,
      `Complete work neatly and safely according to the job brief.`,
      `Carry basic trade tools and use PPE where required.`,
      `Explain simple findings to the site contact before closing the visit.`,
      `Update completion status so the next booking or handover is clear.`,
    ];
  }

  if (category === "maintenance") {
    return [
      `Complete cleaning and facility upkeep tasks at ${company} sites near ${zone}.`,
      `Keep floors, stations and common areas ready for daily operations.`,
      `Report maintenance issues early to the site supervisor.`,
      `Follow hygiene and safety routines through every shift.`,
      `Support shift handovers so the next team starts with a ready floor.`,
    ];
  }

  if (category === "field") {
    return [
      `Complete on-site visits for ${company} across ${zone}${cityBit}.`,
      `Finish assigned field tasks and verification checks on the job card.`,
      `Coordinate with local teams when a visit needs extra support.`,
      `Update visit outcomes in the partner tools after each stop.`,
      `Represent ${company} professionally during every customer or partner meeting.`,
    ];
  }

  if (category === "fitter-welder") {
    return [
      `Complete fitting and/or welding tasks for ${company} to the given specification.`,
      `Use the right tools and PPE for every fabrication or site job.`,
      `Keep joints, alignments and finishes clean and reliable.`,
      `Coordinate with supervisors on measurements and job-card changes.`,
      `Leave the work area tidy and ready for the next stage.`,
    ];
  }

  if (category === "construction") {
    return [
      `Support build-site labour for ${company} around ${zone}${cityBit}.`,
      `Move materials, assist skilled trades and keep the work area clear.`,
      `Follow site safety instructions and wear required PPE.`,
      `Complete daily helper tasks assigned by the site supervisor.`,
      `Help with cleanup so the next trade can start without delay.`,
    ];
  }

  return [
    `Complete day-to-day ${title} tasks for ${company}${place ? ` in ${place}` : ""}.`,
    `Follow the role brief and coordinate with the local team when needed.`,
    `Keep communication clear and update progress on assigned work.`,
    `Meet shift expectations for quality, timing and workplace conduct.`,
    `Represent ${company} professionally throughout the hiring and joining process.`,
  ];
}

/** SEO overview paragraph: role + company + locality/city + pay. */
export function jobOverviewText(job: JobCopyInput) {
  return jobOverviewContent(job).overview;
}

/** Duty bullets that name the role, employer and place. */
export function jobDutyLinesFor(job: JobCopyInput) {
  return jobOverviewContent(job).responsibilities;
}

/** Full structured overview matching a hiring-brief layout. */
export function jobOverviewContent(job: JobCopyInput): JobOverviewContent {
  const locality = (job.locality || "").trim();
  const city = (job.city || "").trim();
  const place = jobPlaceLabel(job);
  const role = (job.title || "").trim() || "this role";
  const company = (job.company || "").trim() || "a verified employer";
  const area = areaLabel(job);
  const pay = formatPay(job.salaryMin, job.salaryMax);
  const body = (job.description || "").trim();
  const action = roleAction(job);

  const hiringLead = place
    ? `${company} is hiring ${role} for the ${area}.`
    : `${company} is hiring ${role}.`;

  const generated = [
    hiringLead,
    `In this role, you will ${action}.`,
    pay
      ? `Offering monthly earnings between ${pay}${
          job.incentiveMax && job.incentiveMax > 0
            ? `, plus incentives up to ₹${job.incentiveMax.toLocaleString("en-IN")}`
            : ""
        } along with regular payouts, this opportunity suits people looking for flexible local work and consistent income.`
      : `This opportunity suits people looking for flexible local work and consistent income.`,
  ].join(" ");

  let overview = generated;
  if (!isGenericDescription(body)) {
    const bodyLower = body.toLowerCase();
    const mentionsPlace =
      (locality.length >= 3 && bodyLower.includes(locality.toLowerCase())) ||
      (city.length >= 3 && bodyLower.includes(city.toLowerCase()));
    const mentionsCompany = bodyLower.includes(company.toLowerCase());
    // Prefer a rich stored brief when it already names place + employer;
    // otherwise lead with our place-aware paragraph and keep the body.
    if (mentionsPlace && mentionsCompany && body.length >= 120) {
      overview = body;
    } else if (mentionsPlace && mentionsCompany) {
      overview = pay
        ? `${body} Monthly earnings typically range between ${pay}.`
        : body;
    } else {
      overview = `${hiringLead} ${body}${
        pay ? ` Monthly earnings typically range between ${pay}.` : ""
      }`;
    }
  }

  const facts: JobOverviewFact[] = [
    { label: "Shift", value: job.shift || job.employmentType || "Flexible" },
    { label: "Job type", value: jobTypeLabel(job) },
    {
      label: "Area",
      value: place
        ? areaZonesLabel(job)
        : job.pincode
          ? `Pincode ${job.pincode}`
          : "Local area assignments",
    },
  ];

  const zone = locality || city || "your local area";
  const cityBit =
    locality && city && locality.toLowerCase() !== city.toLowerCase()
      ? ` in ${city}`
      : "";
  const responsibilities = responsibilitiesFor(
    job,
    role,
    company,
    place,
    zone,
    cityBit,
  );

  const howToApply = `Click Apply to submit your name, phone number, and city through the online application form. After your details are received, GigKaro will share them with ${company} and you can expect follow-up on the next hiring steps, usually within 48 hours.`;

  return { overview, facts, responsibilities, howToApply };
}

export type JobFaqItem = { question: string; answer: string };

/** Job-specific FAQs for the detail page and FAQPage schema. */
export function jobFaqItems(job: JobCopyInput): JobFaqItem[] {
  const role = (job.title || "").trim() || "this role";
  const company = (job.company || "").trim() || "the employer";
  const place = jobPlaceLabel(job);
  const area = place || "your local area";
  const pay = formatPay(job.salaryMin, job.salaryMax);
  const shift = job.shift || "Flexible";
  const employment = job.employmentType || "Flexible";
  const needsVehicle = Boolean(
    job.vehicle && job.vehicle !== "No vehicle required",
  );

  return [
    {
      question: `What is the ${role} job at ${company}${place ? ` in ${place}` : ""}?`,
      answer: `${company} is hiring for ${role}${place ? ` near ${place}` : ""}. Work is based around ${area}, with ${employment.toLowerCase()} timing and ${shift.toLowerCase()} shifts. Final duties and joining steps are confirmed after you apply.`,
    },
    {
      question: `How much can I earn as a ${role}${place ? ` in ${area}` : ""}?`,
      answer: pay
        ? `Monthly earnings for this ${role} role typically range between ${pay}${
            job.incentiveMax && job.incentiveMax > 0
              ? `, with incentives up to ₹${job.incentiveMax.toLocaleString("en-IN")}`
              : ""
          }. Exact payout cycles and incentive rules are shared by ${company} before joining.`
        : `Pay for this ${role} role is confirmed by ${company} during the hiring process, based on shift and performance.`,
    },
    {
      question: `Where will I work for this ${role} opening?`,
      answer: place
        ? `This opening is listed for ${place}${
            job.pincode ? ` (pincode ${job.pincode})` : ""
          }. Assignments stay local around ${area} with ${company}.`
        : `Work location is confirmed by ${company} after you apply. Most openings are local area assignments near your city.`,
    },
    {
      question: `What shift and job type does this ${role} role offer?`,
      answer: `This is a ${employment.toLowerCase()} role with ${shift.toLowerCase()} shifts. Final timings, weekly offs and reporting point are confirmed by the ${company} recruiter before joining.`,
    },
    {
      question: needsVehicle
        ? `Do I need a vehicle for the ${role} job?`
        : `Do I need a vehicle or driving licence for this ${role} job?`,
      answer: needsVehicle
        ? `Yes. This role lists “${job.vehicle}”. Carry a valid driving licence and vehicle documents when you join with ${company}.`
        : `No vehicle is required for this ${role} opening. A smartphone with an active number is usually enough to get started.`,
    },
    {
      question: `How do I apply for the ${role} job${place ? ` in ${area}` : ""}?`,
      answer: `Click Apply on GigKaro, submit your name, phone number and city, and wait for follow-up. GigKaro shares your details with ${company}, and hiring next steps usually begin within 48 hours.`,
    },
  ];
}

/** @deprecated Prefer jobDutyLinesFor(job) for place-aware SEO copy. */
export const jobDutyLines = [
  "Complete your assigned work within your local area.",
  "Coordinate with the local team and follow safety guidelines.",
  "Use the partner app to manage daily tasks and earnings.",
] as const;
