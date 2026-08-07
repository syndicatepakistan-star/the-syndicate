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
  /* Badge width reserve — typing animation must not CLS the header */
  ".dashboard-neon-badge-slot .neon-badge{min-width:min(22rem,92vw)}",
  /* Main shell min height before deferred dashboard-shell.css arrives */
  ".dashboard-main-content-shell{min-height:min(70vh,40rem)}",
  /* Avoid italic face on first paint (CS Daine Italic was in LH critical path) */
  ".dashboard-hamburger-chrome .italic,.dashboard-hamburger-chrome em{",
  "font-style:normal!important",
  "}",
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
  /* Programs offers LCP reserve + amber card geometry (paint before programs-page.css) */
  ".programs-offers-shell,.programs-lcp-shell{min-height:20rem}",
  "@media (min-width:640px){.programs-lcp-shell{min-height:34rem}}",
  ".plan-offer-card{--poc-border:rgba(34,211,238,.72);--poc-glow:rgba(6,182,212,.38)}",
  ".plan-offer-card--amber{--poc-border:rgba(251,191,36,.82);--poc-glow:rgba(245,158,11,.42)}",
  ".plan-offer-card__shell{border:2px solid var(--poc-border);background:#04060d;",
  "box-shadow:0 14px 38px rgba(0,0,0,.58),0 0 42px var(--poc-glow)}",
  ".programs-lcp-media{aspect-ratio:4/3;max-height:13.5rem}",
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
