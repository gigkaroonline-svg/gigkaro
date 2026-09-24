import { InfoPage } from "@/features/info";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Privacy",
  "How GigKaro handles account details, applications and messages.",
  "/privacy",
);
export default function Page() {
  return <InfoPage kind="privacy" />;
}
