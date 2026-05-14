import type { Metadata } from "next";
import AffiliateMarketingPage from "@/components/affiliate/AffiliateMarketingPage";

export const metadata: Metadata = {
  title: "Affiliate · THE SYNDICATE",
  description: "Syndicate affiliate partner programme — tracked links, commissions, and partner dashboard.",
};

export default function AffiliateLandingRoute() {
  return <AffiliateMarketingPage />;
}
