import { Suspense } from "react";
import { LocalJob } from "@/features/local-job";
import { noindex } from "@/lib/metadata";

export const metadata = { title: "Local Demo Job", ...noindex };
export default function Page() {
  return (
    <Suspense>
      <LocalJob />
    </Suspense>
  );
}
