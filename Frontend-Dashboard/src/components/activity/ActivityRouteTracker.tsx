"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { ActivityCategory } from "@/components/dashboard/types";
import { useActivityTimeline } from "@/contexts/ActivityTimelineContext";

const ROUTE_LOG_DEDUPE_MS = 1600;

function describePath(pathname: string): {
  category: ActivityCategory;
  title: string;
  detail: string;
  moreDetails: string;
} {
  if (pathname === "/syndicate" || pathname.startsWith("/syndicate/")) {
    return {
      category: "syndicate",
      title: "Syndicate app route",
      detail: pathname,
      moreDetails:
        "You navigated to a dedicated Syndicate route (separate from the in-shell Syndicate Mode tab on the home dashboard)."
    };
  }
  if (pathname.startsWith("/affiliate/")) {
    return {
      category: "affiliate",
      title: "Affiliate route",
      detail: pathname,
      moreDetails:
        "You opened an affiliate-related URL. Referral identifiers may appear in the path depending on how you arrived here."
    };
  }
  if (pathname.startsWith("/r/")) {
    return {
      category: "affiliate",
      title: "Referral landing",
      detail: pathname,
      moreDetails: "Short referral path (/r/…): typically used for tracked entry into the app."
    };
  }
  if (pathname.startsWith("/membership")) {
    return {
      category: "system",
      title: "Membership content route",
      detail: pathname,
      moreDetails: "You opened membership or library content outside the main dashboard shell."
    };
  }
  return {
    category: "system",
    title: `App route: ${pathname}`,
    detail: "Page navigation",
    moreDetails: `Browser pathname “${pathname}”. Section changes inside the main dashboard (still on “/”) are logged separately as shell visits.`
  };
}

/**
 * Records Next.js route changes into the shared activity timeline.
 * Skips “/” so the main shell’s section-based `recordVisit` entries stay the primary signal there.
 */
export function ActivityRouteTracker() {
  const pathname = usePathname();
  const { recordEvent } = useActivityTimeline();
  const dedupeRef = useRef<{ path: string; t: number }>({ path: "", t: 0 });

  useEffect(() => {
    // Marketing / quiz funnels don't need activity timeline I/O on every navigation.
    if (
      !pathname ||
      pathname === "/" ||
      pathname.startsWith("/quiz") ||
      pathname.startsWith("/our-") ||
      pathname === "/what-you-get" ||
      pathname === "/programs" ||
      pathname === "/membership" ||
      pathname === "/affiliate" ||
      pathname.startsWith("/affiliate/")
    ) {
      return;
    }
    const now = Date.now();
    if (dedupeRef.current.path === pathname && now - dedupeRef.current.t < ROUTE_LOG_DEDUPE_MS) return;
    dedupeRef.current = { path: pathname, t: now };

    const d = describePath(pathname);
    recordEvent({
      category: d.category,
      title: d.title,
      detail: d.detail,
      moreDetails: d.moreDetails,
      route: pathname
    });
  }, [pathname, recordEvent]);

  return null;
}
