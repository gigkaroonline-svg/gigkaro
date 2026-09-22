const employers = [
  {
    id: "swift",
    name: "SwiftBox",
    initials: "sb",
    color: "blue",
  },
  {
    id: "fresh",
    name: "FreshBasket",
    initials: "fb",
    color: "green",
  },
  {
    id: "pack",
    name: "PackPoint",
    initials: "pp",
    color: "orange",
  },
  {
    id: "volt",
    name: "VoltGo",
    initials: "vg",
    color: "violet",
  },
  {
    id: "meal",
    name: "MealDash",
    initials: "md",
    color: "rose",
  },
  {
    id: "local",
    name: "LocalLink",
    initials: "ll",
    color: "teal",
  },
] as const;

export const catalogCompanies = employers.map((c) => ({
  key: c.id,
  name: c.name,
  initials: c.initials,
  color: c.color,
  active: true,
}));

const locations = [
  {
    city: "Bengaluru",
    locality: "Koramangala",
    pincode: "560034",
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    city: "Bengaluru",
    locality: "HSR Layout",
    pincode: "560102",
    lat: 12.9116,
    lng: 77.6389,
  },
  {
    city: "Bengaluru",
    locality: "BTM Layout",
    pincode: "560029",
    lat: 12.9166,
    lng: 77.6101,
  },
  {
    city: "Bengaluru",
    locality: "Bommanahalli",
    pincode: "560068",
    lat: 12.898,
    lng: 77.617,
  },
  {
    city: "Delhi NCR",
    locality: "Lajpat Nagar",
    pincode: "110024",
    lat: 28.5677,
    lng: 77.2433,
  },
  {
    city: "Mumbai",
    locality: "Andheri East",
    pincode: "400069",
    lat: 19.119,
    lng: 72.847,
  },
  {
    city: "Hyderabad",
    locality: "Madhapur",
    pincode: "500081",
    lat: 17.448,
    lng: 78.391,
  },
  {
    city: "Chennai",
    locality: "T Nagar",
    pincode: "600017",
    lat: 13.0418,
    lng: 80.2341,
  },
  {
    city: "Pune",
    locality: "Hinjewadi",
    pincode: "411057",
    lat: 18.591,
    lng: 73.738,
  },
  {
    city: "Kolkata",
    locality: "Salt Lake",
    pincode: "700091",
    lat: 22.576,
    lng: 88.433,
  },
  {
    city: "Ahmedabad",
    locality: "Navrangpura",
    pincode: "380009",
    lat: 23.036,
    lng: 72.561,
  },
] as const;

const roles = [
  {
    title: "Delivery Partner",
    category: "delivery",
    employer: 0,
    min: 22000,
    max: 32000,
    vehicle: "Bike required" as const,
  },
  {
    title: "Warehouse Associate",
    category: "warehouse",
    employer: 2,
    min: 18000,
    max: 24000,
    vehicle: "No vehicle required" as const,
  },
  {
    title: "Grocery Delivery Partner",
    category: "commerce",
    employer: 1,
    min: 24000,
    max: 35000,
    vehicle: "Bike required" as const,
  },
  {
    title: "EV Delivery Rider",
    category: "ev",
    employer: 3,
    min: 21000,
    max: 30000,
    vehicle: "EV accepted" as const,
  },
  {
    title: "Food Delivery Partner",
    category: "food",
    employer: 4,
    min: 20000,
    max: 34000,
    vehicle: "Bike required" as const,
  },
  {
    title: "Field Executive",
    category: "field",
    employer: 5,
    min: 18000,
    max: 26000,
    vehicle: "No vehicle required" as const,
  },
  {
    title: "Last Mile Associate",
    category: "logistics",
    employer: 0,
    min: 20000,
    max: 28000,
    vehicle: "Bike required" as const,
  },
  {
    title: "QR Installation Executive",
    category: "other",
    employer: 5,
    min: 16000,
    max: 22000,
    vehicle: "No vehicle required" as const,
  },
] as const;

export const catalogJobs = locations.flatMap((location, li) =>
  roles.slice(0, li < 4 ? 8 : 4).map((role, ri) => {
    const company = employers[role.employer];
    return {
      jobKey: `job_${li}_${ri}`,
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
      salaryType: "monthly" as const,
      incentiveMax: ri % 2 === 0 ? 6000 : 2000,
      openings: 18 - ri,
      immediateJoining: ri % 3 !== 2,
      vehicle: role.vehicle,
      verified: true,
      employmentType:
        ri % 3 === 0
          ? ("Full-time" as const)
          : ri % 3 === 1
            ? ("Part-time" as const)
            : ("Flexible" as const),
      shift:
        ri % 3 === 0
          ? ("Morning" as const)
          : ri % 3 === 1
            ? ("Night" as const)
            : ("Flexible" as const),
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
