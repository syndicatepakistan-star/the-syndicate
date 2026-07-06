import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "What You Get",
  description:
    "See what you get inside The Syndicate: elite programs, trading vaults, AI systems, community access, and the operator playbook for building real income.",
  path: "/what-you-get",
});

export default function WhatYouGetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
