import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Affiliate Program",
  description:
    "Join The Syndicate affiliate program — earn commissions with tracked links, partner dashboard, and elite program referrals.",
  path: "/affiliate",
});

const AffiliateMarketingPage = dynamic(
  () => import("@/components/affiliate/AffiliateMarketingPage"),
  {
    loading: () => (
      <div className="min-h-[100dvh] bg-[#04060c]">
        <div className="mx-auto max-w-4xl px-6 pt-28">
          <div className="h-12 w-3/4 max-w-xl animate-pulse rounded-lg bg-white/10" />
          <div className="mt-6 h-24 animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
    ),
  },
);

export default function AffiliateLandingRoute() {
  return <AffiliateMarketingPage />;
}
