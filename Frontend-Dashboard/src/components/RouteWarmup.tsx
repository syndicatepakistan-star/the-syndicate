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
    const isPrograms = pathname === "/programs" || pathname.startsWith("/programs/");
    const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    const isAuthHeavy =
      pathname.startsWith("/syndicate-otp") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/verify-otp") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/affiliate");

    // Never warm marketing GIF/MP4s on member shell — LH showed ~9MB (tt.gif + videos).
    if (!isFounder && !isQuiz && !isPrograms && !isDashboard && !isAuthHeavy) {
      scheduleMarketingMediaWarmup({ deferProgramsBand: isHome });
    }

    // Auth / checkout / quiz mobile: zero route prefetch — unused JS competes with LCP/TBT.
    if (isPrograms || isDashboard || isAuthHeavy) return;

    const isMobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    if (isQuiz && isMobile) return;

    // Homepage: wait past LCP quiet window before prefetch pulls more JS (mobile longer).
    const homeDelay = isMobile ? 12000 : 7000;
    runWhenIdle(() => {
      router.prefetch("/programs");
      if (!isFounder) router.prefetch("/membership");
    }, isHome ? homeDelay : isFounder || isQuiz ? 2800 : 1200);
  }, [router, pathname]);

  return null;
}
