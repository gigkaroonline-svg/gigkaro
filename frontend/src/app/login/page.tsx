import { Suspense } from "react";
import { AuthPage } from "@/features/auth";
import { noindex } from "@/lib/metadata";

export const metadata = { title: "Login", ...noindex };
export default function Page() {
  return (
    <Suspense>
      <AuthPage mode="login" />
    </Suspense>
  );
}
