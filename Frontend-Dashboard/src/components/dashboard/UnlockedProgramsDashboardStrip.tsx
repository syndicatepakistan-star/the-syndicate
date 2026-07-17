"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DASHBOARD_HEADING_LIGHTNING,
  cn,
} from "@/components/dashboard/dashboardPrimitives";
import type { DashboardCourseLike } from "@/components/dashboard/useDashboardSnapshots";
import type { DashboardNavKey } from "@/components/dashboard/types";
import {
  PROGRAM_CARD_FRAME,
  PROGRAM_CARD_INNER_SHELL,
  PROGRAM_CARD_LANDSCAPE_MEDIA,
  PROGRAM_CARD_LANDSCAPE_MEDIA_OVERLAY,
} from "@/components/programs/programCardMedia";
import {
  getInstructorSlideNeonTheme,
  neonAccentStyleVars,
} from "@/data/instructorSlideNeonThemes";
import { parseDashboardProgramRef, requestDashboardProgramOpen } from "@/lib/programUnlockFlow";
import { prefetchStreamPlaylistExperience } from "@/lib/streaming-api";

const SCROLL_STEP_PX = 266;

const CARD_BACKGROUNDS: readonly string[] = [
  "from-amber-600/85 via-orange-900/50 to-black",
  "from-violet-600/85 via-purple-950/50 to-black",
  "from-sky-600/85 via-blue-950/50 to-black",
  "from-emerald-600/80 via-teal-950/50 to-black",
];

const STRIP_GRADIENT_BORDER =
  "linear-gradient(135deg, rgba(34,211,238,0.52), rgba(251,191,36,0.42), rgba(192,132,252,0.46))";

type Props = {
  programs: DashboardCourseLike[];
  onNavigate: (nav: DashboardNavKey) => void;
  /** Renders inside the dashboard hero panel without a separate outer frame. */
  embedded?: boolean;
};

export function UnlockedProgramsDashboardStrip({ programs, onNavigate, embedded = false }: Props) {
  const neon = getInstructorSlideNeonTheme(2);
  const unlocked = programs.filter((p) => p.unlocked !== false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollEdges();
    const onScroll = () => updateScrollEdges();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => updateScrollEdges()) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [unlocked.length, updateScrollEdges]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * SCROLL_STEP_PX, behavior: "smooth" });
  };

  const openProgram = (program: DashboardCourseLike) => {
    const ref = parseDashboardProgramRef(program.id);
    if (!ref) return;
    if (ref.type === "playlist") {
      requestDashboardProgramOpen({
        playlistId: ref.id,
        onNavigate: (section) => onNavigate(section),
      });
      return;
    }
    requestDashboardProgramOpen({
      courseId: ref.id,
      onNavigate: (section) => onNavigate(section),
    });
  };

  const content = (
    <div className="relative z-[1]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h3
                id="dashboard-unlocked-programs-title"
                className={cn(
                  DASHBOARD_HEADING_LIGHTNING,
                  "font-mono text-[clamp(1rem,1.8vw+0.5rem,1.35rem)] font-black uppercase italic tracking-[0.07em]",
                )}
              >
                Your programs
              </h3>
              <p className="mt-1.5 max-w-[40rem] text-[13px] leading-snug text-white/68">
                Open any unlocked playlist and continue watching from the Programs section.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("programs")}
              className="shrink-0 self-start rounded-lg border border-[color:var(--neon-accent-border)] bg-black/40 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--neon-accent-bright)] shadow-[0_0_20px_var(--neon-accent-glow)] transition hover:bg-black/55 sm:self-auto"
            >
              All programs →
            </button>
          </div>

          {unlocked.length === 0 ? (
            <div className="mt-5 rounded-xl border border-white/12 bg-black/35 px-4 py-8 text-center text-[13px] text-white/58">
              No unlocked programs yet. Browse the library to add your first playlist.
              <button
                type="button"
                onClick={() => onNavigate("programs")}
                className="mt-4 block w-full text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--gold)]/92 underline-offset-2 hover:underline sm:mx-auto sm:w-auto"
              >
                Browse programs
              </button>
            </div>
          ) : (
            <div className="relative mt-5">
              {(canScrollLeft || canScrollRight) && (
                <div className="mb-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => scrollByDir(-1)}
                    disabled={!canScrollLeft}
                    aria-label="Scroll programs left"
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/45 bg-black/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.16)] transition",
                      "hover:border-cyan-300/70 hover:bg-black/65 hover:shadow-[0_0_22px_rgba(34,211,238,0.28)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/55",
                      "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-cyan-400/45 disabled:hover:bg-black/50 disabled:hover:shadow-[0_0_16px_rgba(34,211,238,0.16)]",
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.4} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByDir(1)}
                    disabled={!canScrollRight}
                    aria-label="Scroll programs right"
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/45 bg-black/50 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.16)] transition",
                      "hover:border-cyan-300/70 hover:bg-black/65 hover:shadow-[0_0_22px_rgba(34,211,238,0.28)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/55",
                      "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-cyan-400/45 disabled:hover:bg-black/50 disabled:hover:shadow-[0_0_16px_rgba(34,211,238,0.16)]",
                    )}
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={2.4} aria-hidden />
                  </button>
                </div>
              )}
              <div
                ref={scrollRef}
                className="dashboard-unlocked-programs-scroll -mx-1 overflow-x-auto px-1 pb-1 no-scrollbar"
              >
                <ul className="flex w-max min-w-full gap-3 sm:gap-4">
                  {unlocked.map((program, index) => {
                    const grad = CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length];
                    const ref = parseDashboardProgramRef(program.id);
                    const progress = Math.max(0, Math.min(100, program.progressPct ?? 0));

                    return (
                      <li key={program.id} className="w-[250px] shrink-0">
                        <article
                          className={cn(
                            "group/card flex h-full w-[250px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-400/45",
                            "bg-gradient-to-br from-cyan-500/[0.08] to-black/70 shadow-[0_0_24px_rgba(34,211,238,0.14)]",
                          )}
                        >
                          <span className={PROGRAM_CARD_FRAME}>
                            <span className={PROGRAM_CARD_INNER_SHELL}>
                              <div className={PROGRAM_CARD_LANDSCAPE_MEDIA}>
                                {program.imageSrc ? (
                                  <img
                                    src={program.imageSrc}
                                    alt=""
                                    width={400}
                                    height={225}
                                    className="program-playlist-card__cover-img absolute inset-0 h-full w-full object-cover object-center"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <div className={cn("absolute inset-0 bg-gradient-to-br", grad)} aria-hidden />
                                )}
                                <div className={PROGRAM_CARD_LANDSCAPE_MEDIA_OVERLAY} />
                                {progress > 0 ? (
                                  <div className="absolute bottom-0 left-0 right-0 z-[4] h-1 bg-black/50">
                                    <div
                                      className="h-full bg-[color:var(--gold)]/85"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2">
                                {program.meta ? (
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/72">
                                    {program.meta}
                                  </p>
                                ) : null}
                                <h4 className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] font-extrabold uppercase leading-snug tracking-[0.04em] text-white/92">
                                  {program.title}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => openProgram(program)}
                                  onMouseEnter={() => {
                                    if (ref?.type === "playlist") {
                                      void prefetchStreamPlaylistExperience(ref.id);
                                    }
                                  }}
                                  onFocus={() => {
                                    if (ref?.type === "playlist") {
                                      void prefetchStreamPlaylistExperience(ref.id);
                                    }
                                  }}
                                  className="mt-auto w-full rounded-md border border-[rgba(250,204,21,0.42)] bg-[rgba(250,204,21,0.1)] px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/95 shadow-[0_0_20px_rgba(251,191,36,0.18)] transition hover:scale-[1.02] hover:border-[rgba(250,204,21,0.62)] hover:shadow-[0_0_28px_rgba(251,191,36,0.28)] active:scale-[0.98]"
                                >
                                  {ref?.type === "course" ? "Open course" : "Open playlist"}
                                </button>
                              </div>
                            </span>
                          </span>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
    </div>
  );

  if (embedded) {
    return (
      <section
        style={neonAccentStyleVars(neon)}
        className="relative z-[2] mt-5 border-t border-white/[0.06] pt-5 dashboard-perf-section"
        aria-labelledby="dashboard-unlocked-programs-title"
      >
        {content}
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="relative w-full overflow-hidden rounded-lg p-[2px] shadow-[0_0_40px_rgba(34,211,238,0.12),0_0_48px_rgba(251,191,36,0.1)]"
      style={{ background: STRIP_GRADIENT_BORDER }}
      aria-labelledby="dashboard-unlocked-programs-title"
    >
      <div
        style={neonAccentStyleVars(neon)}
        className="dashboard-cyber-neon-panel cut-frame cyber-frame relative overflow-hidden rounded-[11px] border-2 border-[color:var(--neon-accent-border)] bg-black px-4 py-5 sm:px-6 sm:py-6"
      >
        <div className="dashboard-cyber-neon-wash pointer-events-none absolute inset-0 opacity-90" aria-hidden />
        {content}
      </div>
    </motion.section>
  );
}
