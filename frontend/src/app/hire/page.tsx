import { HirePage } from "@/features/hire";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Hire Gig Workers Near You",
  "Post a local gig job and reach people who can start work nearby.",
  "/hire",
);
export default function Page() {
  return <HirePage />;
}
