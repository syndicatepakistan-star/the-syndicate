"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import toast from "react-hot-toast";
import { INSTRUCTOR_SLIDES } from "@/data/instructorSlides";
import {
  getInstructorSlideNeonTheme,
  neonAccentStyleVars,
} from "@/data/instructorSlideNeonThemes";
import { unlockInstructorSlide } from "@/lib/instructorSlideUnlock";
import { cn } from "@/components/dashboard/dashboardPrimitives";

const AUTO_ADVANCE_MS = 6000;
const INSTRUCTOR_SLIDESHOW_BG_VIDEO = "/assets/bg.mp4";

export function InstructorSlideshow({ showPanelBackgroundVideo = true }: { showPanelBackgroundVideo?: boolean }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [inView, setInView] = useState(true);
  const slides = INSTRUCTOR_SLIDES;
  const total = slides.length;

  const active = slides[idx] ?? slides[0];
  const neonTheme = getInstructorSlideNeonTheme(idx);

  const goTo = useCallback(
    (next: number) => {
      if (total < 1) return;
      setIdx(((next % total) + total) % total);
    },
    [total],
  );

  const goPrev = useCallback(() => {
    setIdx((current) => ((current - 1 + total) % total));
  }, [total]);

  const goNext = useCallback(() => {
    setIdx((current) => (current + 1) % total);
  }, [total]);

  const handleDotSelect = useCallback(
    (nextIndex: number) => {
      goTo(nextIndex);
    },
    [goTo],
  );

  useEffect(() => {
    setIdx((current) => {
      if (total < 1) return 0;
      return current >= total ? current % total : current;
    });
  }, [total]);

  const handleUnlock = useCallback(async () => {
    if (unlockBusy) return;
    setUnlockBusy(true);
    try {
      const result = await unlockInstructorSlide(active);
      if (!result.ok && result.message) {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setUnlockBusy(false);
    }
  }, [active, unlockBusy]);

  useEffect(() => {
    if (!autoPlay || !inView || total < 2) return;
    const t = window.setInterval(() => {
      setIdx((current) => (current + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(t);
  }, [autoPlay, inView, total]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting));
      },
      { root: null, threshold: 0.08, rootMargin: "80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showPanelBackgroundVideo) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    const play = () => {
      void el.play().catch(() => {});
    };
    play();
    el.addEventListener("loadeddata", play);
    el.addEventListener("canplay", play);
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) play();
            },
            { threshold: 0.12 },
          )
        : null;
    if (observer && panelRef.current) observer.observe(panelRef.current);
    return () => {
      el.removeEventListener("loadeddata", play);
      el.removeEventListener("canplay", play);
      observer?.disconnect();
    };
  }, [showPanelBackgroundVideo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  const navBtnClass = cn(
    "instructor-slideshow-nav-btn grid h-11 w-11 shrink-0 place-items-center rounded-lg border-2 transition",
    "border-[color:var(--instructor-neon-border)] bg-black/55 text-[color:var(--instructor-neon-bright)]",
    "hover:bg-[color:var(--instructor-neon)]/20 hover:shadow-[0_0_18px_var(--instructor-neon-glow)]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--instructor-neon-bright)]",
    "disabled:pointer-events-none disabled:opacity-40"
  );

  const isLcp = idx === 0;

  return (
    <div
      ref={panelRef}
      data-instructor-slide={idx}
      style={{
        ...neonAccentStyleVars(neonTheme),
        ["--lightning-color" as string]: neonTheme.neonBright,
        ["--lightning-color-soft" as string]: neonTheme.glow,
      }}
      className={cn(
        "instructor-slideshow-panel instructor-slideshow-lightning dashboard-perf-contain syndicate-mood-skip-frame cut-frame cyber-frame relative isolate overflow-hidden p-[clamp(1.1rem,2.5vw+0.5rem,1.75rem)]",
        showPanelBackgroundVideo ? "glass-dark" : "bg-[rgba(4,8,14,0.92)]"
      )}
      aria-roledescription="carousel"
      aria-label="Featured instructor programs"
    >
      {showPanelBackgroundVideo ? (
        <div
          className="instructor-slideshow-bg pointer-events-none absolute inset-0 z-[0] overflow-hidden bg-black"
          aria-hidden
        >
          <video
            ref={videoRef}
            src={INSTRUCTOR_SLIDESHOW_BG_VIDEO}
            className="instructor-slideshow-bg-video absolute inset-0 z-[0] h-full w-full min-h-full min-w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
          <div className="instructor-slideshow-bg-scrim absolute inset-0 z-[1]" />
        </div>
      ) : null}
      <div className="relative z-[2] grid grid-cols-1 gap-[clamp(1.25rem,3vw+0.5rem,2.5rem)] lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-center gap-[clamp(1rem,2vw+0.35rem,1.5rem)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--instructor-neon-border)]/40 pb-[clamp(0.65rem,1.2vw,0.9rem)]">
            <p className="instructor-slideshow-feature-kicker m-0 font-black uppercase tracking-[0.22em] text-[color:var(--instructor-neon-bright)]">
              Featured program
            </p>
            <div className="flex items-center gap-2">
              <span className="instructor-slideshow-counter tabular-nums font-black uppercase tracking-[0.14em] text-white/75">
                {idx + 1}
                <span className="text-white/35"> / </span>
                {total}
              </span>
              <button
                type="button"
                onClick={() => setAutoPlay((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition sm:text-[12px]",
                  autoPlay
                    ? "border-[color:var(--instructor-neon-border)] bg-[color:var(--instructor-neon)]/15 text-[color:var(--instructor-neon-bright)]"
                    : "border-white/20 bg-white/5 text-white/60"
                )}
                aria-pressed={autoPlay}
                aria-label={autoPlay ? "Pause auto-advance" : "Resume auto-advance"}
              >
                {autoPlay ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
                {autoPlay ? "Auto" : "Paused"}
              </button>
            </div>
          </div>

          <div className="space-y-[clamp(0.85rem,2vw+0.3rem,1.35rem)]" aria-live="polite" aria-atomic="true">
            <div className="instructor-slideshow-kicker font-black uppercase tracking-[0.18em] text-white/55">
              Instructor
            </div>
            <h3 className="instructor-slideshow-heading instructor-slideshow-heading--lightning instructor-slideshow-title m-0 font-black uppercase leading-[1.08] tracking-[0.05em]">
              {active.programName}
            </h3>
            <p className="instructor-slideshow-instructor m-0 font-bold text-white">
              {active.instructorName}
            </p>
            <p className="instructor-slideshow-description m-0 font-medium leading-[1.55] text-white/90">
              {active.description}
            </p>
            <button
              type="button"
              disabled={unlockBusy}
              onClick={() => void handleUnlock()}
              className={cn(
                "instructor-slideshow-unlock-btn inline-flex w-full max-w-xl items-center justify-center rounded-lg border-2 px-4 py-2.5 text-left font-black uppercase leading-tight tracking-[0.1em] transition sm:px-5 sm:py-3 sm:tracking-[0.12em]",
                "border-[color:var(--instructor-neon-border)] bg-[color:var(--instructor-neon)]/18 text-[color:var(--instructor-neon-bright)]",
                "shadow-[0_0_20px_var(--instructor-neon-haze),inset_0_1px_0_rgba(255,255,255,0.1)]",
                "hover:bg-[color:var(--instructor-neon)]/28 hover:shadow-[0_0_28px_var(--instructor-neon-glow)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--instructor-neon-bright)]",
                unlockBusy && "cursor-wait opacity-75",
              )}
            >
              <span className="min-w-0 text-balance">
                {unlockBusy ? "Starting checkout…" : `Unlock Now — ${active.programName}`}
              </span>
            </button>
          </div>

          <div className="relative z-[5] flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              className={cn(navBtnClass, "touch-manipulation")}
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              aria-label="Previous program"
              disabled={total < 2}
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.6} aria-hidden />
            </button>

            <div
              className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto overscroll-x-contain py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Programs"
            >
              {slides.map((slide, i) => (
                <button
                  key={`${slide.programName}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`${slide.programName} — ${i + 1} of ${total}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDotSelect(i);
                  }}
                  className={cn(
                    "instructor-slideshow-dot h-3 w-3 shrink-0 rounded-[4px] border-2 transition hover:scale-110 hover:border-white/45 sm:h-3.5 sm:w-3.5",
                    i === idx
                      ? "border-[color:var(--instructor-neon-border)] bg-[color:var(--instructor-neon)]/45 shadow-[0_0_14px_var(--instructor-neon-glow)] scale-110"
                      : "border-white/20 bg-white/12"
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              className={cn(navBtnClass, "touch-manipulation")}
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              aria-label="Next program"
              disabled={total < 2}
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        </div>

        <div
          className="instructor-slide-media instructor-slide-media--static relative min-h-[clamp(18rem,42vh,28rem)] w-full overflow-hidden rounded-xl border-2 border-[color:var(--instructor-neon-border)]/55 bg-[#060a12] shadow-[inset_0_0_48px_rgba(0,0,0,0.5),0_0_32px_var(--instructor-neon-haze)]"
          aria-hidden={false}
        >
          <div
            className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.38)_100%)]"
            aria-hidden
          />
          <div className="relative z-[2] flex h-full min-h-[inherit] w-full items-center justify-center p-4 sm:p-6">
            <Image
              key={active.src}
              src={active.src}
              alt={`${active.instructorName} — ${active.programName}`}
              width={720}
              height={540}
              sizes="(max-width: 1024px) 92vw, 520px"
              quality={isLcp ? 85 : 72}
              priority={isLcp}
              loading={isLcp ? undefined : "lazy"}
              decoding="async"
              className="instructor-slide-photo max-h-full max-w-full h-auto w-auto object-contain drop-shadow-[0_14px_48px_rgba(0,0,0,0.7)]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
