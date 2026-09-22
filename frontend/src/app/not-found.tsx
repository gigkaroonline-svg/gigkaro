import Link from "next/link";
import { EmptyState } from "@/components/primitives";
export default function NotFound() {
  return (
    <div className="container page-content">
      <EmptyState
        title="This opportunity has moved on."
        description="The link may have expired, or this location isn’t available in the demo yet. There’s more work to explore."
      >
        <Link className="button button-primary" href="/jobs">
          Find Nearby Jobs
        </Link>
        <Link className="button button-outline" href="/locations">
          Explore Locations
        </Link>
      </EmptyState>
    </div>
  );
}
