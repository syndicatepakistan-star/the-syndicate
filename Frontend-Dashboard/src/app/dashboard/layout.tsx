import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "@/styles/programs-page.css";
/* Dashboard chrome — keep off marketing /programs first paint. */
import "@/styles/dashboard-shell.css";
/* Mission HUD + programs FX CSS load deferred via client (see DeferredDashboard*Css). */

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Syndicate member dashboard.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/assets/logo-nav.webp"
        fetchPriority="high"
      />
      {children}
    </>
  );
}
