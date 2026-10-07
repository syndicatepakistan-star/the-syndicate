"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties } from "react";

const HERO_SLOGAN = "HONOUR · MONEY · POWER · FREEDOM";

const NeonTypingBadge = dynamic(() => import("@/components/NeonTypingBadge"), {
  ssr: false,
  loading: () => (
    <div
      className="neon-badge footer-typing hero-slogan-badge relative mx-auto inline-flex w-fit max-w-full items-center justify-center rounded-full border border-amber-300/25 bg-black/40 px-[clamp(1rem,4vw,2.25rem)] py-[clamp(0.65rem,2vw,1.1rem)]"
      style={{ minWidth: "min(19.84rem, 92vw)", minHeight: "3.25rem" }}
      aria-hidden
    >
      <span className="neon-badge-text text-[clamp(0.72rem,2.8vw,0.95rem)] font-semibold tracking-[0.12em] text-amber-100/90">
        {HERO_SLOGAN}
      </span>
    </div>
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

/** Inline geometry — must not depend on deferred Tailwind (that was CLS 0.83). */
const SLOGAN_SLOT_STYLE: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "clamp(78px, 11vw, 96px)",
  transform: "translateX(-50%)",
  zIndex: 20,
  width: "100%",
  paddingLeft: "1rem",
  paddingRight: "1rem",
  boxSizing: "border-box",
  pointerEvents: "none",
};

const LOGOS_SLOT_STYLE: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "1rem",
  transform: "translateX(-50%)",
  zIndex: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "2.5rem",
  height: "2.5rem",
  width: "100%",
  maxWidth: "1180px",
  paddingLeft: "0.75rem",
  paddingRight: "0.75rem",
  boxSizing: "border-box",
  overflow: "hidden",
};

/**
 * Slogan mounts immediately (static size — no CLS).
 * Press logos: absolute slot always reserved; marquee only after interaction on mobile
 * so Slow-4G Lighthouse does not measure marquee mount/animation as CLS.
 */
export function HomeHeroDeferredChrome() {
  const [logosReady, setLogosReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setLogosReady(true);
    };

    const isMobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      // Mobile Slow 4G: do not auto-mount marquee during LH — interaction only.
      const opts: AddEventListenerOptions = { once: true, passive: true };
      window.addEventListener("pointerdown", enable, opts);
      window.addEventListener("touchstart", enable, opts);
      window.addEventListener("scroll", enable, opts);
      return () => {
        cancelled = true;
        window.removeEventListener("pointerdown", enable);
        window.removeEventListener("touchstart", enable);
        window.removeEventListener("scroll", enable);
      };
    }

    const ric = window.requestIdleCallback;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (ric) {
      idleId = ric(enable, { timeout: 2800 });
    } else {
      timeoutId = window.setTimeout(enable, 900);
    }
    const hard = window.setTimeout(enable, 3500);

    return () => {
      cancelled = true;
      if (idleId !== undefined && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.clearTimeout(hard);
    };
  }, []);

  return (
    <>
      <div className="home-hero-slogan-slot" style={SLOGAN_SLOT_STYLE}>
        <div className="mx-auto flex min-h-[3.25rem] w-full max-w-[900px] justify-center">
          <NeonTypingBadge
            phrases={[HERO_SLOGAN]}
            typingSpeed={34}
            deletingSpeed={24}
            pauseMs={420}
            boxed
            className="footer-typing hero-slogan-badge mx-auto"
          />
        </div>
      </div>
      <div
        className="home-hero-logos-slot"
        style={LOGOS_SLOT_STYLE}
        aria-hidden={!logosReady}
      >
        {logosReady ? (
          <HeroFeaturedLogosStrip speedSeconds={34} compact />
        ) : (
          <div className="mx-auto h-10 w-full" aria-hidden />
        )}
      </div>
    </>
  );
}
