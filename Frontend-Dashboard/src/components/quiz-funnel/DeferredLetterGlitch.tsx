"use client";

import { useEffect, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";

const LetterGlitch = dynamic(() => import("@/components/quiz-funnel/LetterGlitch"), {
  ssr: false,
});

type Props = ComponentProps<typeof LetterGlitch>;

/**
 * Mounts the animated glitch canvas only after the browser is idle, so the
 * quiz page paints (FCP/LCP) without paying the canvas/JS cost up front.
 * The static `.quiz-glitch-placeholder` backdrop stays visible until then.
 */
export default function DeferredLetterGlitch(props: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const handle = ric(() => setReady(true), { timeout: 2200 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <LetterGlitch {...props} />;
}
