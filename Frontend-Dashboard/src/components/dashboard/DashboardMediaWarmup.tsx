"use client";

import { useLayoutEffect } from "react";
import { warmVideo } from "@/lib/mediaWarmCache";
import { DASHBOARD_MAIN_BG_VIDEO } from "@/components/dashboard/DashboardShellBackground";

/** Warm dashboard shell MP4 once per session so remounts do not cold-start decode. */
export function DashboardMediaWarmup() {
  useLayoutEffect(() => {
    void warmVideo(DASHBOARD_MAIN_BG_VIDEO);
  }, []);
  return null;
}
