import { BlogListing, blogListingMetadata } from "./listing";

export const revalidate = 30;

export async function generateMetadata() {
  return blogListingMetadata(1);
}

export default function Page() {
  return <BlogListing page={1} />;
}
