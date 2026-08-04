import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";
import "@/styles/public-marketing-responsive.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Syndicate Guarantee",
  description:
    "The Syndicate Guarantee — how we stand behind Money Mastery and operator outcomes.",
  path: "/syndicate-guarantee",
});

export default function SyndicateGuaranteeLayout({ children }: { children: ReactNode }) {
  return children;
}
