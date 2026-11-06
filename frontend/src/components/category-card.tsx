import Link from "next/link";
import {
  Bike,
  Utensils,
  Zap,
  Boxes,
  Truck,
  BatteryCharging,
  MapPinned,
  BriefcaseBusiness,
  Wrench,
  PlugZap,
  Settings,
  Cog,
  Factory,
  Flame,
  Headset,
  HardHat,
  ArrowUpRight,
} from "lucide-react";
import type { Category } from "@/types";
const icons = {
  Bike,
  Utensils,
  Zap,
  Boxes,
  Truck,
  BatteryCharging,
  MapPinned,
  BriefcaseBusiness,
  Wrench,
  PlugZap,
  Settings,
  Cog,
  Factory,
  Flame,
  Headset,
  HardHat,
};
const CATEGORY_SEO_PATH: Record<string, string> = {
  delivery: "/delivery-jobs/bengaluru/",
  warehouse: "/warehouse-jobs/bengaluru/",
  logistics: "/logistics-jobs/bengaluru/",
  field: "/field-jobs/bengaluru/",
  ev: "/ev-rider-jobs/bengaluru/",
};

export function CategoryCard({ category }: { category: Category }) {
  const Icon = icons[category.icon as keyof typeof icons] || Bike;
  // Dedicated SEO hubs when we have them; otherwise open jobs filtered by
  // category (Telecallers, Construction, Technicians, …).
  const href =
    CATEGORY_SEO_PATH[category.id] ||
    `/jobs/?category=${encodeURIComponent(category.id)}`;
  return (
    <Link href={href} className="category-card" prefetch={false}>
      <div className={`icon-tile ${category.color}`}>
        <Icon size={22} />
      </div>
      <h3>{category.title}</h3>
      <p>{category.subtitle}</p>
      <span>
        Browse roles
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}
