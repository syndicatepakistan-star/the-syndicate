"use client";

import { useEffect } from "react";
import { purgeExpiredStreamPlaybackCache } from "@/lib/streaming-api";
import {
  ensureDashboardTabResumeBridge,
  registerDashboardTabResumeTask,
} from "@/lib/dashboardTabResume";

/** Global stale-state cleanup when the user returns to an idle tab. */
export default function TabResumeCoordinator() {
  useEffect(() => ensureDashboardTabResumeBridge(), []);

  useEffect(
    () =>
      registerDashboardTabResumeTask(() => {
        purgeExpiredStreamPlaybackCache();
      }),
    [],
  );

  return null;
}
