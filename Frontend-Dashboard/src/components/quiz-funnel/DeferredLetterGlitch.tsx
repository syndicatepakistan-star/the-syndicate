"use client";

import { useEffect, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";

const LetterGlitch = dynamic(() => import("@/components/quiz-funnel/LetterGlitch"), {
  ssr: false,
});

type Props = ComponentProps<typeof LetterGlitch>;

function shouldSkipGlitch(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  // Canvas letter grid is a major mobile main-thread cost — keep CSS placeholder only.
  if (window.matchMedia("(max-width: 900px)").matches) return true;
  type NetworkInformation = { saveData?: boolean; effectiveType?: string };
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return true;
  const effectiveType = connection?.effectiveType ?? "";
  return effectiveType === "2g" || effectiveType === "slow-2g" || effectiveType === "3g";
}

/**
 * Desktop-only animated glitch, deferred until idle.
 * Mobile / reduced-motion keep the static CSS placeholder (FCP/LCP/TBT safe).
 */
export default function DeferredLetterGlitch(props: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (shouldSkipGlitch()) return;

    const ric = window.requestIdleCallback;
    if (ric) {
      const handle = ric(() => setReady(true), { timeout: 5000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => setReady(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <LetterGlitch {...props} />;
}
