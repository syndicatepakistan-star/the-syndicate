import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { DeferredDashboardShellCss } from "@/components/dashboard/DeferredDashboardShellCss";
/* Full dashboard-shell.css (~296KB) deferred via DeferredDashboardShellCss — not SSR-blocking. */
/* programs-page.css deferred via DeferredDashboardProgramsPageCss (programs route / idle). */
/* Mission HUD + programs FX CSS load deferred via client (see DeferredDashboard*Css). */

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Syndicate member dashboard.",
  path: "/dashboard",
  noIndex: true,
});

/** Critical first-paint chrome only — keep tiny; full shell CSS hydrates right after. */
const DASHBOARD_CRITICAL_CSS = [
  "html,body{background:#000!important;color-scheme:dark}",
  /* Navbar / shell slots so chrome geometry exists before deferred CSS */
  ".premium-navbar{min-height:3.25rem;border:1px solid rgba(212,175,55,.55);background:#000}",
  ".dashboard-shell-surface,.dashboard-shell-surface-strong{background:#000;border-color:rgba(212,175,55,.55)}",
  ".dashboard-neon-badge-slot{min-height:3.25rem}",
  /* Featured slideshow — lock height so dynamic mount / font swap don't CLS */
  ".dashboard-featured-slideshow{",
  "min-height:min(32rem,70vh);",
  "contain:layout style",
  "}",
  "@media (min-width:768px){.dashboard-featured-slideshow{",
  "min-height:min(28rem,52vh)",
  "}}",
  ".instructor-slideshow-panel{",
  "min-height:min(30rem,68vh);",
  "box-sizing:border-box",
  "}",
  "@media (min-width:768px){.instructor-slideshow-panel{min-height:min(26rem,50vh)}}",
  ".instructor-slideshow-title{min-height:2.4em}",
  ".instructor-slideshow-description{min-height:4.65em}",
  ".instructor-slide-media{aspect-ratio:4/3;min-height:clamp(18rem,42vh,28rem)}",
  /* Programs offers LCP reserve */
  ".programs-offers-shell,.programs-lcp-shell{min-height:20rem}",
  "@media (min-width:640px){.programs-lcp-shell{min-height:34rem}}",
].join("");

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CRITICAL_CSS }} />
      <DeferredDashboardShellCss />
      {children}
    </>
  );
}
