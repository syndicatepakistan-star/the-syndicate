import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Founder",
  description:
    "Meet the founder behind The Syndicate — the vision, doctrine, and operator mindset driving elite business and trading education worldwide.",
  path: "/our-founder",
});

export default function OurFounderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
