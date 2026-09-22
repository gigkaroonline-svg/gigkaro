import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@/styles/globals.css";
import { MainHeader, Footer, MobileNav } from "@/components/layout";
import { WebMCP } from "@/components/webmcp";
import { DemoProvider } from "@/hooks/use-demo-store";
import { AuthProvider } from "@/hooks/use-auth";
export const metadata: Metadata = {
  title: {
    default: "GigKaro — Find Gig Jobs Near You",
    template: "%s | GigKaro",
  },
  description:
    "Kaam Karo. Kamao. Find nearby delivery, warehouse, logistics and field opportunities by pincode.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "GigKaro — Find Gig Jobs Near You",
    description: "Good work. Closer to home.",
    type: "website",
  },
  twitter: { card: "summary", title: "GigKaro — Find Gig Jobs Near You" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>
          <AuthProvider>
            <WebMCP />
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <MainHeader />
            <main id="main">{children}</main>
            <Footer />
            <MobileNav />
          </AuthProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
