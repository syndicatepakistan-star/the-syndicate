"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { INSTRUCTOR_SLIDES } from "@/data/instructorSlides";
import { nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

const MONEY_MASTERY_LCP = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 384, 55);
const INSTRUCTOR_LCP = INSTRUCTOR_SLIDES[0]?.src ?? "";

function readPlaylistOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has("playlist");
  } catch {
    return false;
  }
}

/**
 * Exactly one high-priority image preload for the active dashboard surface.
 * Avoids unused-preload warnings (Money Mastery on playlist view, logo fighting LCP).
 */
export function DashboardLcpPreload({ sectionKey }: { sectionKey: string }) {
  const pathname = usePathname() ?? "";
  const [playlistOpen, setPlaylistOpen] = useState(readPlaylistOpen);

  useEffect(() => {
    const sync = () => setPlaylistOpen(readPlaylistOpen());
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("syndicate:url", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("syndicate:url", sync);
    };
  }, [pathname, sectionKey]);

  const onPrograms =
    sectionKey === "programs" ||
    pathname === "/dashboard/programs" ||
    pathname.startsWith("/dashboard/programs/");

  // Playlist lesson view: LCP is episode UI — do not preload Money Mastery.
  if (onPrograms && !playlistOpen && MONEY_MASTERY_LCP) {
    return <link rel="preload" as="image" href={MONEY_MASTERY_LCP} fetchPriority="high" />;
  }

  if (sectionKey === "dashboard" && INSTRUCTOR_LCP) {
    return <link rel="preload" as="image" href={INSTRUCTOR_LCP} fetchPriority="high" />;
  }

  return null;
}
