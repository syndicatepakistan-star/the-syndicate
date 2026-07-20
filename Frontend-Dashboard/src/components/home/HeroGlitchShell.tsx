"use client";

import { useEffect, useRef } from "react";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import { hasHeroGlitchSnapshot } from "@/lib/heroGlitchSnapshot";
import { HeroGlitchBackground } from "@/components/home/HeroGlitchBackground";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof HeroGlitchBackground>;

/** Hero loop video background + placeholder fade once media is ready. */
export function HeroGlitchShell({ className, ...props }: Props) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const isMobile = useMatchMedia("(max-width: 767px)");

  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;

    const markReady = () => {
      el.dataset.glitchReady = "true";
    };

    if (hasHeroGlitchSnapshot()) {
      markReady();
      return;
    }

    const host = el.parentElement;
    const video = host?.querySelector("video");
    if (video) {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        markReady();
        return;
      }
      video.addEventListener("loadeddata", markReady, { once: true });
      video.addEventListener("canplay", markReady, { once: true });
    }

    const timer = window.setTimeout(markReady, isMobile ? 80 : 160);
    return () => {
      window.clearTimeout(timer);
      video?.removeEventListener("loadeddata", markReady);
      video?.removeEventListener("canplay", markReady);
    };
  }, [isMobile]);

  return (
    <>
      <div ref={placeholderRef} className="hero-glitch-placeholder absolute inset-0 z-0" aria-hidden />
      <HeroGlitchBackground {...props} className={className} />
    </>
  );
}
