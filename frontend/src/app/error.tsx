"use client";
import { EmptyState } from "@/components/primitives";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container page-content">
      <EmptyState
        title="We couldn’t load this page right now."
        description="Please try again. Your saved jobs and applications are still on this device."
      >
        <button className="button button-primary" onClick={reset}>
          Try Again
        </button>
      </EmptyState>
    </div>
  );
}
