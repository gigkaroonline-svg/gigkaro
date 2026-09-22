import { Suspense } from "react";
import { LocalJob } from "@/features/local-job";
export const metadata = { title: "Local Demo Job" };
export default function Page() {
  return (
    <Suspense>
      <LocalJob />
    </Suspense>
  );
}
