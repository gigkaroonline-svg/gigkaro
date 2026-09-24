import { DiscoveryPage } from "@/features/discovery";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Explore Categories",
  "Explore delivery, food, warehouse, logistics, EV rider and field roles.",
  "/categories",
);
export default function Page() {
  return <DiscoveryPage kind="categories" />;
}
