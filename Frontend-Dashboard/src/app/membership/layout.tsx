import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "@/styles/public-marketing-responsive.css";

export const metadata: Metadata = buildPageMetadata({
  title: "The Knight Membership — The Syndicate Vault Access",
  description:
    "Enter The Knight — The Syndicate monthly membership for operators who want selected courses, Syndicate Mode, and member library access. Money Mastery remains the lifetime vault unlock.",
  path: "/membership",
});

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
