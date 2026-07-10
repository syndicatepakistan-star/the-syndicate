import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Founder — The Syndicate",
  description:
    "Meet the founder of The Syndicate — the operator doctrine behind Money Mastery, Syndicate Trading, and elite business education at the-syndicate.com.",
  path: "/our-founder",
});

export default function OurFounderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
