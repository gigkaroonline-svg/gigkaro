import { InfoPage } from "@/features/info";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Contact",
  "Send a message to GigKaro at info@gigkaro.in.",
  "/contact",
);
export default function Page() {
  return <InfoPage kind="contact" />;
}
