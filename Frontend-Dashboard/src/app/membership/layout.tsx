import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Membership — The Knight",
  description:
    "Join The Syndicate membership — The Knight tier with premium access, elite content, and the full operator ecosystem for serious builders.",
  path: "/membership",
});

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
