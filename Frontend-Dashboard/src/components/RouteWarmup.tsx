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

    // Auth / checkout: zero route prefetch — unused JS was ~170–220 KiB on /login.
    if (isPrograms || isDashboard || isAuthHeavy) return;

    // Homepage: wait past LCP quiet window + deferred hero video before prefetch pulls more JS.
    runWhenIdle(() => {
      router.prefetch("/programs");
      if (!isFounder) router.prefetch("/membership");
    }, isHome ? 5500 : isFounder || isQuiz ? 2800 : 1200);
  }, [router, pathname]);

  return null;
}
