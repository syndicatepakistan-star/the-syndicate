"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { scheduleMarketingMediaWarmup } from "@/lib/mediaWarmCache";

function runWhenIdle(task: () => void, timeout = 3000): void {
  const ric = window.requestIdleCallback;
  if (ric) {
    ric(task, { timeout });
    return;
  }
  window.setTimeout(task, Math.min(timeout, 800));
}

/**
 * Prefetch only high-intent next steps after paint.
 * Avoid prefetching the full marketing graph — that downloads unused JS and tanks mobile TBT.
 */
export default function RouteWarmup() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isHome = pathname === "/";
    const isFounder = pathname === "/our-founder";
    const isQuiz = pathname === "/quiz" || pathname.startsWith("/quiz/");

    // Founder + quiz: skip marketing media warmup (competes with LCP / unused network).
    if (!isFounder && !isQuiz) {
      scheduleMarketingMediaWarmup({ deferProgramsBand: isHome });
    }

    runWhenIdle(() => {
      router.prefetch("/programs");
      router.prefetch("/membership");
    }, isFounder || isQuiz ? 2800 : 1200);
  }, [router, pathname]);

  return null;
}
