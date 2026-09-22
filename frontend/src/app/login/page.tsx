import { Suspense } from "react";
import { AuthPage } from "@/features/auth";
export const metadata = { title: "Login" };
export default function Page() {
  return (
    <Suspense>
      <AuthPage mode="login" />
    </Suspense>
  );
}
