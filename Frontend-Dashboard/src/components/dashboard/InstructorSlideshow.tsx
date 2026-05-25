"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { INSTRUCTOR_SLIDES } from "@/data/instructorSlides";
import {
  getInstructorSlideNeonTheme,
  neonAccentStyleVars,
} from "@/data/instructorSlideNeonThemes";
import { cn } from "@/components/dashboard/dashboardPrimitives";

export function InstructorSlideshow() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);
  const prevIdxRef = useRef(0);
  const slides = INSTRUCTOR_SLIDES;

  const active = slides[idx] ?? slides[0];
  const neonTheme = getInstructorSlideNeonTheme(idx);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const slideEls = Array.from(wrapRef.current.querySelectorAll<HTMLElement>("[data-slide]"));
    slideEls.forEach((s, i) => {
      gsap.set(s, {
        opacity: i === idx ? 1 : 0,
        x: i === idx ? 0 : 12,
        scale: i === idx ? 1 : 1.01,
      });
    });
  }, [idx]);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const slideEls = Array.from(wrapRef.current.querySelectorAll<HTMLElement>("[data-slide]"));
    if (slideEls.length < 2) return;

    const prev = prevIdxRef.current;
    if (prev === idx) return;
    prevIdxRef.current = idx;

    const outEl = slideEls[prev];
    const inEl = slideEls[idx];
    if (!outEl || !inEl) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.set(inEl, { opacity: 0, x: 16, scale: 1.02 }, 0)
      .to(outEl, { opacity: 0, x: -16, scale: 1.01, duration: 0.65 }, 0)
      .to(inEl, { opacity: 1, x: 0, scale: 1, duration: 0.75 }, 0.12);
  }, [idx]);

  useLayoutEffect(() => {
    const t = window.setInterval(() => setIdx((v) => (v + 1) % slides.length), 5200);
    return () => window.clearInterval(t);
  }, [slides.length]);

  return (
    <div
      ref={wrapRef}
      data-anim="in"
      data-instructor-slide={idx}
      style={neonAccentStyleVars(neonTheme)}
      className="instructor-slideshow-panel syndicate-mood-skip-frame cut-frame cyber-frame glass-dark relative overflow-hidden p-[var(--fluid-deck-p)]"
    >
      <div className="relative z-[1] grid grid-cols-1 gap-[clamp(1rem,2.5vw+0.5rem,2rem)] lg:grid-cols-2 lg:items-center">
        <div className="flex min-w-0 flex-col gap-[clamp(0.85rem,2vw+0.25rem,1.35rem)]">
          <div className="space-y-[clamp(0.65rem,1.5vw+0.2rem,1rem)]" aria-live="polite" aria-atomic="true">
            <div>
              <div className="fluid-text-ui-xs font-black uppercase tracking-[0.2em] text-white/45">
                Instructor
              </div>
              <h3 className="instructor-slideshow-heading mt-1.5 text-[clamp(1rem,1.8vw+0.55rem,1.35rem)] font-black uppercase leading-snug tracking-[0.08em]">
                {active.programName}
              </h3>
              <p className="mt-1 text-[clamp(0.72rem,0.4vw+0.58rem,0.86rem)] font-semibold text-white/80">
                {active.instructorName}
              </p>
              <p className="mt-2 text-[clamp(0.68rem,0.45vw+0.55rem,0.88rem)] leading-relaxed text-white/72 line-clamp-4">
                {active.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1" role="tablist" aria-label="Instructor slides">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                aria-selected={i === idx}
                aria-label={slide.programName}
                onClick={() => setIdx(i)}
                className={cn(
                  "h-[10px] w-[10px] rounded-[3px] border transition hover:border-white/35",
                  i === idx
                    ? "border-[color:var(--instructor-neon-border)] bg-[color:var(--instructor-neon)]/35 shadow-[0_0_12px_var(--instructor-neon-glow)]"
                    : "border-white/15 bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <div className="instructor-slide-media relative min-h-[clamp(16rem,36vh,24rem)] w-full overflow-hidden rounded-xl border border-white/20 bg-[#060a12] shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]">
          <div
            className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.42)_100%)]"
            aria-hidden
          />
          {slides.map((slide, i) => (
            <div
              key={slide.src}
              data-slide
              className="absolute inset-0 z-[2] flex items-center justify-center p-3 sm:p-4 md:p-5"
              style={{ opacity: i === idx ? 1 : 0 }}
            >
              <Image
                src={slide.src}
                alt={`${slide.instructorName} — ${slide.programName}`}
                width={720}
                height={540}
                sizes="(max-width: 1024px) 92vw, 480px"
                quality={88}
                priority={i === 0}
                loading={i === idx ? "eager" : "lazy"}
                className="instructor-slide-photo max-h-full max-w-full h-auto w-auto object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
