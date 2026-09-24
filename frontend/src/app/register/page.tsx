import { Suspense } from "react";
import { AuthPage } from "@/features/auth";
import { noindex } from "@/lib/metadata";

export const metadata = { title: "Register", ...noindex };
export default function Page() {
  return (
    <Suspense>
      <AuthPage mode="register" />
    </Suspense>
  );
}
