"use client";

import { useEffect, useRef } from "react";
import { HeroGlitchBackground } from "@/components/home/HeroGlitchBackground";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import { hasHeroGlitchSnapshot } from "@/lib/heroGlitchSnapshot";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof HeroGlitchBackground>;

/** Hero matrix background + placeholder fade once canvas is ready. */
export function HeroGlitchShell({ className, glitchSpeed, smooth, ...glitchProps }: Props) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const isMobile = useMatchMedia("(max-width: 767px)");

  useEffect(() => {
    const host = placeholderRef.current?.parentElement;
    if (!host) return;

    const markReady = () => {
      const el = placeholderRef.current;
      if (el) el.dataset.glitchReady = "true";
    };

    if (hasHeroGlitchSnapshot()) {
      markReady();
    }

    const canvas = host.querySelector("canvas");
    if (canvas && canvas.width > 0) {
      markReady();
      return;
    }

    const observer = new MutationObserver(() => {
      const c = host.querySelector("canvas");
      if (c && c.width > 0) {
        markReady();
        observer.disconnect();
      }
    });
    observer.observe(host, { childList: true, subtree: true, attributes: true });

    const timer = window.setTimeout(markReady, 120);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div ref={placeholderRef} className="hero-glitch-placeholder absolute inset-0 z-0" aria-hidden />
      <HeroGlitchBackground
        {...glitchProps}
        glitchSpeed={isMobile ? Math.max(glitchSpeed ?? 70, 110) : glitchSpeed}
        smooth={isMobile ? false : smooth}
        className={className}
      />
    </>
  );
}
