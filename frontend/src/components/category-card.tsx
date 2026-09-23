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
};
export function CategoryCard({
  category,
  count,
}: {
  category: Category;
  count: number;
}) {
  const Icon = icons[category.icon as keyof typeof icons] || Bike;
  return (
    <Link href={`/jobs?category=${category.id}`} className="category-card">
      <div className={`icon-tile ${category.color}`}>
        <Icon size={22} />
      </div>
      <h3>{category.title}</h3>
      <p>{category.subtitle}</p>
      <span>
        {count > 0
          ? `${count} open ${count === 1 ? "role" : "roles"}`
          : "Browse roles"}
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}
