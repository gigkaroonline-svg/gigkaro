import { Suspense } from "react";
import { AuthPage } from "@/features/auth";
export const metadata = { title: "Register" };
export default function Page() {
  return (
    <Suspense>
      <AuthPage mode="register" />
    </Suspense>
  );
}
