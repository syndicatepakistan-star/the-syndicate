"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { prefetchMarketingRoutes } from "@/lib/marketing-nav-routes";
import { scheduleMarketingMediaWarmup } from "@/lib/mediaWarmCache";

function runWhenIdle(task: () => void, timeout = 3000): void {
  const ric = window.requestIdleCallback;
  if (ric) {
    ric(task, { timeout });
    return;
  }
  window.setTimeout(task, 200);
}

/** Prefetch marketing routes + warm shared media after critical paint. */
export default function RouteWarmup() {
  const router = useRouter();

  useEffect(() => {
    const isHome = typeof window !== "undefined" && window.location.pathname === "/";
    scheduleMarketingMediaWarmup({ deferProgramsBand: isHome });

    // High-intent route — prefetch immediately so / → /programs feels instant.
    router.prefetch("/programs");

    runWhenIdle(() => {
      prefetchMarketingRoutes(router);
    }, 600);
  }, [router]);

  return null;
}
