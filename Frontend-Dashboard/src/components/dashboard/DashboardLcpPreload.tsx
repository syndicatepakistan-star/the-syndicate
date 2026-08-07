"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OFFER_PLAN_THUMB_MONEY_MASTERY } from "@/components/programs/offerPlanThumbnails";
import { INSTRUCTOR_SLIDES } from "@/data/instructorSlides";
import { nextOptimizedImageUrl } from "@/lib/optimizeImageUrl";

const MONEY_MASTERY_LCP = nextOptimizedImageUrl(OFFER_PLAN_THUMB_MONEY_MASTERY, 384, 55);
/** Match InstructorSlideshow Next/Image sizes (~94vw mobile / ~480 desktop). */
const INSTRUCTOR_LCP = nextOptimizedImageUrl(INSTRUCTOR_SLIDES[0]?.src ?? "", 640, 70);

function readPlaylistOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has("playlist");
  } catch {
    return false;
  }
}

/**
 * Client SPA nav: keep exactly one high-priority image preload for the active surface.
 * First paint preload comes from dashboard/page.tsx — avoid duplicating it on hydrate.
 */
export function DashboardLcpPreload({ sectionKey }: { sectionKey: string }) {
  const pathname = usePathname() ?? "";
  const [playlistOpen, setPlaylistOpen] = useState(readPlaylistOpen);
  const [allowClientPreload, setAllowClientPreload] = useState(false);
  const bootedRef = useRef(false);

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

  useEffect(() => {
    if (!bootedRef.current) {
      bootedRef.current = true;
      return;
    }
    setAllowClientPreload(true);
  }, [sectionKey, pathname]);

  if (!allowClientPreload) return null;

  const onPrograms =
    sectionKey === "programs" ||
    pathname === "/dashboard/programs" ||
    pathname.startsWith("/dashboard/programs/");

  if (onPrograms && !playlistOpen && MONEY_MASTERY_LCP) {
    return <link rel="preload" as="image" href={MONEY_MASTERY_LCP} fetchPriority="high" />;
  }

  if (sectionKey === "dashboard" && INSTRUCTOR_LCP) {
    return <link rel="preload" as="image" href={INSTRUCTOR_LCP} fetchPriority="high" />;
  }

  return null;
}
