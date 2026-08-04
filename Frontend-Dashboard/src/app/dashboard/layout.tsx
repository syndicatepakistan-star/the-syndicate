import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import "@/styles/programs-page.css";
/* Mission HUD chrome — keep off marketing /programs first paint (globals used to pull these). */
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
