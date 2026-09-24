import { InfoPage } from "@/features/info";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "About",
  "GigKaro connects people with nearby gig work and helps employers hire locally.",
  "/about",
);
export default function Page() {
  return <InfoPage kind="about" />;
}
