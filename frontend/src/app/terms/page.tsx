import { InfoPage } from "@/features/info";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Terms",
  "The terms for using GigKaro to find work or post jobs.",
  "/terms",
);
export default function Page() {
  return <InfoPage kind="terms" />;
}
