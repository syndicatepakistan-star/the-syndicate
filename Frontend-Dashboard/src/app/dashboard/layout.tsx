import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
/* Dashboard chrome — keep off marketing /programs first paint. */
import "@/styles/dashboard-shell.css";
/* programs-page.css deferred via DeferredDashboardProgramsPageCss (programs route / idle). */
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
      {/* Logo is tiny chrome — do not compete with featured LCP image. */}
      <link rel="preload" as="image" href="/assets/logo-nav.webp" fetchPriority="low" />
      {/* Avoid white Lighthouse filmstrip before client CSS paints. */}
      <style
        dangerouslySetInnerHTML={{
          __html: "html,body{background:#000!important;color-scheme:dark}",
        }}
      />
      {children}
    </>
  );
}
