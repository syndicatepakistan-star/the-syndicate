import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Guss Qureshi — Founder of The Syndicate",
  description:
    "Meet Guss Qureshi, founder of The Syndicate. Read independent Forbes, GQ, and Luxury Lifestyle Magazine coverage of The Syndicate, Money Mastery, ethical leadership, power, and influence.",
  path: "/our-founder",
  keywords: [
    "Guss Qureshi",
    "Guss Qureshi founder",
    "The Syndicate founder",
    "The Syndicate Forbes",
    "The Syndicate GQ",
    "The Syndicate Luxury Lifestyle Magazine",
    "The Syndicate Money Mastery",
    "The Syndicate business education",
  ],
});

export default function OurFounderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
