import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "What You Get — The Syndicate Vault, Packs & Alliance",
  description:
    "Inside The Syndicate: Money Mastery vault, Syndicate Trading, AI packs including the faceless YouTube track, Syndicate business models, behaviour psychology, and alliance access for operators who execute.",
  path: "/what-you-get",
});

export default function WhatYouGetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
