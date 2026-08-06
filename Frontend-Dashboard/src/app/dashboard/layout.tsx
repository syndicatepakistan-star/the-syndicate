import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";
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

const MONEY_MASTERY_LCP = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 384, 55);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Logo is tiny chrome — do not compete with featured / Money Mastery LCP. */}
      <link rel="preload" as="image" href="/assets/logo-nav.webp" fetchPriority="low" />
      {/* Usual /dashboard/programs LCP candidate. */}
      <link rel="preload" as="image" href={MONEY_MASTERY_LCP} fetchPriority="high" />
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
