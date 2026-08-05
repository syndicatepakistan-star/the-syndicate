"use client";

import { DashboardShellBackground } from "@/components/dashboard/DashboardShellBackground";

export { DASHBOARD_MAIN_BG_VIDEO } from "@/components/dashboard/DashboardShellBackground";

/** MP4 backdrop for the main dashboard column only (not sidebar / top navbar). */
export function DashboardMainVideoBackground({
  opacity = 0.22,
  disabled = false,
}: {
  opacity?: number;
  disabled?: boolean;
}) {
  return <DashboardShellBackground opacity={opacity} disabled={disabled} />;
}
