import type { Category } from "@/types";
export const categories: Category[] = [
  {
    id: "delivery",
    title: "Delivery Partners",
    subtitle: "Deliver packages, earn more",
    icon: "Bike",
    color: "blue",
    aliases: ["food", "commerce", "ev"],
  },
  {
    id: "warehouse",
    title: "Warehouse & Packers",
    subtitle: "Pick, pack and keep things moving",
    icon: "Boxes",
    color: "amber",
  },
  {
    id: "logistics",
    title: "Drivers & Logistics",
    subtitle: "Drive routes, connect the last mile",
    icon: "Truck",
    color: "teal",
  },
  {
    id: "technician",
    title: "Technicians",
    subtitle: "Install, repair and service equipment",
    icon: "Wrench",
    color: "violet",
  },
  {
    id: "electrician-plumber",
    title: "Electricians & Plumbers",
    subtitle: "Wiring, fittings and repairs",
    icon: "PlugZap",
    color: "orange",
  },
  {
    id: "maintenance",
    title: "Service & Maintenance Workers",
    subtitle: "Keep sites and facilities running",
    icon: "Settings",
    color: "green",
  },
  {
    id: "machine-operator",
    title: "Machine Operators",
    subtitle: "Run machines on the shop floor",
    icon: "Cog",
    color: "slate",
  },
  {
    id: "factory",
    title: "Production & Factory Workers",
    subtitle: "Steady shifts on production lines",
    icon: "Factory",
    color: "rose",
  },
  {
    id: "fitter-welder",
    title: "Fitters & Welders",
    subtitle: "Fabrication, fitting and welding",
    icon: "Flame",
    color: "orange",
  },
  {
    id: "field",
    title: "Field Service Workers",
    subtitle: "On-site visits across your area",
    icon: "MapPinned",
    color: "rose",
  },
  {
    id: "telecaller",
    title: "Telecallers",
    subtitle: "Call customers, support and sell",
    icon: "Headset",
    color: "blue",
  },
  {
    id: "construction",
    title: "Construction Workers",
    subtitle: "Build sites, daily and contract work",
    icon: "HardHat",
    color: "amber",
  },
];

/** Maps retired category ids (food, commerce, ev) to the card that now covers them. */
export function categoryGroupId(id: string) {
  return categories.find((c) => c.id === id || c.aliases?.includes(id))?.id || id;
}
