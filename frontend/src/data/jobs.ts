import type { Job } from "@/types";
import { locations } from "./locations";
import { employers } from "./employers";
const roles = [
  {
    title: "Delivery Partner",
    category: "delivery",
    employer: 0,
    min: 22000,
    max: 32000,
    vehicle: "Bike required",
  },
  {
    title: "Warehouse Associate",
    category: "warehouse",
    employer: 2,
    min: 18000,
    max: 24000,
    vehicle: "No vehicle required",
  },
  {
    title: "Grocery Delivery Partner",
    category: "commerce",
    employer: 1,
    min: 24000,
    max: 35000,
    vehicle: "Bike required",
  },
  {
    title: "EV Delivery Rider",
    category: "ev",
    employer: 3,
    min: 21000,
    max: 30000,
    vehicle: "EV accepted",
  },
  {
    title: "Food Delivery Partner",
    category: "food",
    employer: 4,
    min: 20000,
    max: 34000,
    vehicle: "Bike required",
  },
  {
    title: "Field Executive",
    category: "field",
    employer: 5,
    min: 18000,
    max: 26000,
    vehicle: "No vehicle required",
  },
  {
    title: "Last Mile Associate",
    category: "logistics",
    employer: 0,
    min: 20000,
    max: 28000,
    vehicle: "Bike required",
  },
  {
    title: "QR Installation Executive",
    category: "other",
    employer: 5,
    min: 16000,
    max: 22000,
    vehicle: "No vehicle required",
  },
] as const;
export const jobs: Job[] = locations.flatMap((location, li) =>
  roles.slice(0, li < 4 ? 8 : 4).map((role, ri) => {
    const company = employers[role.employer];
    return {
      id: `job_${li}_${ri}`,
      slug: `${role.title.toLowerCase().replaceAll(" ", "-")}-${location.pincode}`,
      title: role.title,
      company: company.name,
      companyId: company.id,
      initials: company.initials,
      color: company.color,
      category: role.category,
      city: location.city,
      locality: location.locality,
      pincode: location.pincode,
      lat: location.lat + ri * 0.002,
      lng: location.lng + ri * 0.002,
      distanceKm: 2.4 + ri * 0.3,
      salaryMin: role.min,
      salaryMax: role.max,
      salaryType: "monthly",
      incentiveMax: ri % 2 === 0 ? 6000 : 2000,
      openings: 18 - ri,
      immediateJoining: ri % 3 !== 2,
      vehicle: role.vehicle,
      verified: true,
      employmentType:
        ri % 3 === 0 ? "Full-time" : ri % 3 === 1 ? "Part-time" : "Flexible",
      shift: ri % 3 === 0 ? "Morning" : ri % 3 === 1 ? "Night" : "Flexible",
      postedAt: ri < 3 ? "Today" : "2 days ago",
      description: `Join ${company.name}'s ${location.locality} team. Work close to home with clear earnings, supportive local coordinators and a simple joining process. This is a fictional opportunity for exploring GigKaro.`,
      requirements: [
        "Must be at least 18 years old",
        "A smartphone with an active mobile number",
        "Basic familiarity with your local area",
        role.vehicle === "No vehicle required"
          ? "No vehicle or driving licence needed"
          : "Valid driving licence and vehicle documents",
      ],
    };
  }),
);
