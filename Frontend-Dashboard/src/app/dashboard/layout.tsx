import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "@/styles/programs-page.css";
/* Dashboard chrome + mission HUD — keep off marketing /programs first paint. */
import "@/styles/dashboard-shell.css";
import "@/app/syndicate-bonus-hud.css";
import "@/app/syndicate-mega-mission.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Syndicate member dashboard.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
