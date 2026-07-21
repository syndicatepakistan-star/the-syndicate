"use client";

import { useEffect } from "react";

/**
 * Dashboard media warmup intentionally does not prefetch shell video or offer
 * thumbs. Prefetch competed with LCP and inflated network payloads in Lighthouse
 * without changing UX — the shell video still loads idle via DashboardShellBackground.
 */
export function DashboardMediaWarmup() {
  useEffect(() => {
    // Remove any stale LCP preload links left from older builds / soft navigations.
    document.head.querySelectorAll('link[data-dashboard-lcp-preload="1"]').forEach((node) => node.remove());
    document.head.querySelectorAll('link[data-dashboard-video-prefetch="1"]').forEach((node) => node.remove());
  }, []);

  return null;
}
