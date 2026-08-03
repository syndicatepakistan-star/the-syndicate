import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "@/styles/programs-page.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Syndicate member dashboard.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
