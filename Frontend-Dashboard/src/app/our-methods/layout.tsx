import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Methods",
  description:
    "How The Syndicate teaches operators to decode systems, build leverage, and execute — structured methods for business, trading, and digital sovereignty.",
  path: "/our-methods",
});

export default function OurMethodsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
