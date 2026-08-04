import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "@/styles/public-marketing-responsive.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Our Methods — Syndicate Money Mastery & Operator Doctrine",
  description:
    "How The Syndicate trains operators: decode the system, build leverage, and execute. Doctrine behind Money Mastery, Syndicate Trading, Syndicate business models, and behaviour psychology — not university theory.",
  path: "/our-methods",
});

export default function OurMethodsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
