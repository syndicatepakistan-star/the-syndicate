"use client";

import { useEffect } from "react";

/**
 * Dashboard media warmup intentionally does not prefetch shell video or offer
 * thumbs. Prefetch competed with LCP and inflated network payloads in Lighthouse
 * without changing UX — the shell video still loads idle via DashboardShellBackground.
 */
export function DashboardMediaWarmup() {
  useEffect(() => {
    // Drop stale video prefetch hints only — never strip the active LCP preload.
    document.head.querySelectorAll('link[data-dashboard-video-prefetch="1"]').forEach((node) => node.remove());
  }, []);

  return null;
}
