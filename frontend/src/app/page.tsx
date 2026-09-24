import { HomePage } from "@/features/home";
import { pageMetadata } from "@/lib/metadata";

const title = "GigKaro — Find Gig Jobs Near You";
const description =
  "Kaam Karo. Kamao. Find nearby delivery, warehouse, logistics and field jobs by pincode.";

export const metadata = {
  ...pageMetadata(title, description, "/"),
  title: { absolute: title },
};

export default function Page() {
  return <HomePage />;
}
