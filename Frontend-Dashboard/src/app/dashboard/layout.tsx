import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
/* Dashboard chrome — keep sync so navbar/shell never FOUC. Heavy FX/HUD CSS stays deferred. */
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
      {/* Avoid white Lighthouse filmstrip; reserve offer card height to cut CLS. */}
      <style
        dangerouslySetInnerHTML={{
          __html: [
            "html,body{background:#000!important;color-scheme:dark}",
            ".programs-offers-shell,.programs-lcp-shell{min-height:20rem}",
            "@media (min-width:640px){.programs-lcp-shell{min-height:34rem}}",
          ].join(""),
        }}
      />
      {children}
    </>
  );
}
