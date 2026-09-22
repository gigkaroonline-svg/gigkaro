import { Suspense } from "react";
import { AuthPage } from "@/features/auth";
export const metadata = { title: "Verify-Otp" };
export default function Page() {
  return (
    <Suspense>
      <AuthPage mode="otp" />
    </Suspense>
  );
}
