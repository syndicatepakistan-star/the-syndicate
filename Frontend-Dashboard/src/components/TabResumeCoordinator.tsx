"use client";

import { useTabResume } from "@/hooks/useTabResume";
import { purgeExpiredStreamPlaybackCache } from "@/lib/streaming-api";

/** Global stale-state cleanup when the user returns to an idle tab. */
export default function TabResumeCoordinator() {
  useTabResume(() => {
    purgeExpiredStreamPlaybackCache();
  });
  return null;
}
