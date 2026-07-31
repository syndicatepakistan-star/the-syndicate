"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const NeonTypingBadge = dynamic(() => import("@/components/NeonTypingBadge"), {
  ssr: false,
  loading: () => (
    <div
      className="footer-typing hero-slogan-badge mx-auto h-9 w-[min(92vw,28rem)] rounded-full border border-amber-300/25 bg-black/40"
      aria-hidden
    />
  ),
});

const HeroFeaturedLogosStrip = dynamic(
  () =>
    import("@/components/home/HeroFeaturedLogosStrip").then((m) => ({
      default: m.HeroFeaturedLogosStrip,
    })),
  {
    ssr: false,
    loading: () => <div className="mx-auto h-10 w-full max-w-[1180px]" aria-hidden />,
  },
);

/**
 * Slogan + press strip — deferred so hero LCP (logo image) wins the main thread.
 * Mounts after first paint / idle so Lighthouse TBT and Speed Index improve.
 */
export function HomeHeroDeferredChrome() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const ric = window.requestIdleCallback;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (ric) {
      idleId = ric(enable, { timeout: 1600 });
    } else {
      timeoutId = window.setTimeout(enable, 400);
    }

    // Fail-safe: always show chrome shortly after load.
    const hard = window.setTimeout(enable, 2200);

    return () => {
      cancelled = true;
      if (idleId !== undefined && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.clearTimeout(hard);
    };
  }, []);

  if (!ready) {
    return (
      <>
        <div
          className="pointer-events-none absolute left-1/2 z-20 w-full -translate-x-1/2 px-4"
          style={{ top: "clamp(78px, 11vw, 96px)" }}
          aria-hidden
        >
          <div className="mx-auto flex w-full max-w-[900px] justify-center">
            <div className="footer-typing hero-slogan-badge mx-auto h-9 w-[min(92vw,28rem)] rounded-full border border-amber-300/20 bg-black/35" />
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-[1180px] -translate-x-1/2 px-3 sm:bottom-6 sm:px-4" aria-hidden>
          <div className="mx-auto h-10 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none absolute left-1/2 z-20 w-full -translate-x-1/2 px-4"
        style={{ top: "clamp(78px, 11vw, 96px)" }}
      >
        <div className="mx-auto flex w-full max-w-[900px] justify-center">
          <NeonTypingBadge
            phrases={["HONOUR · MONEY · POWER · FREEDOM"]}
            typingSpeed={34}
            deletingSpeed={24}
            pauseMs={420}
            boxed
            className="footer-typing hero-slogan-badge mx-auto"
          />
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 z-20 w-full max-w-[1180px] -translate-x-1/2 px-3 sm:bottom-6 sm:px-4">
        <HeroFeaturedLogosStrip speedSeconds={34} compact />
      </div>
    </>
  );
}
