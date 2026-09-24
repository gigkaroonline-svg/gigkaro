import { InfoPage } from "@/features/info";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Cookies",
  "How GigKaro uses cookies on this website.",
  "/cookies",
);
export default function Page() {
  return <InfoPage kind="cookies" />;
}
