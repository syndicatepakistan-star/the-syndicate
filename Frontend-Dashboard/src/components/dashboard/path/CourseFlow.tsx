"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DashboardNavKey } from "../types";
import type { CourseRec, GoalId, OpportunityTone } from "./goalPathData";
import { GOAL_PATH_STAGE_COUNT, opportunityTriplesForStage } from "./goalPathData";
import type { DashboardCourseLike } from "../useDashboardSnapshots";
import { ArrowConnectorHorizontal, ArrowConnectorVertical } from "./ArrowConnector";
import { cn } from "../dashboardPrimitives";

const CAROUSEL_MS = 4200;

/** Our Methods–style neon frames (timeline card family). */
const TONE_SKIN: Record<
  OpportunityTone,
  {
    border: string;
    glow: string;
    aura: string;
    panel: string;
    chip: string;
    heading: string;
    btn: string;
    btnHover: string;
  }
> = {
  amber: {
    border: "border-amber-400/90",
    glow: "shadow-[0_0_0_2px_rgba(251,191,36,0.82),0_0_48px_rgba(245,158,11,0.55),0_0_92px_rgba(234,88,12,0.28)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(251,191,36,0.5),rgba(146,64,14,0.35)_48%,transparent_74%)]",
    panel: "bg-[linear-gradient(165deg,rgba(24,16,4,0.92),rgba(6,6,4,0.97))]",
    chip: "border-amber-300/70 bg-amber-950/55 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.45)]",
    heading: "text-amber-100 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]",
    btn: "border-amber-300/75 bg-amber-950/40 text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.25)]",
    btnHover: "hover:border-amber-200 hover:shadow-[0_0_32px_rgba(251,191,36,0.4)]",
  },
  rose: {
    border: "border-rose-500/90",
    glow: "shadow-[0_0_0_2px_rgba(244,63,94,0.82),0_0_48px_rgba(225,29,72,0.55),0_0_92px_rgba(136,19,55,0.35)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(244,63,94,0.55),rgba(136,19,55,0.42)_48%,transparent_74%)]",
    panel: "bg-[linear-gradient(165deg,rgba(22,6,10,0.94),rgba(8,4,6,0.98))]",
    chip: "border-rose-400/70 bg-rose-950/50 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.4)]",
    heading: "text-rose-100 drop-shadow-[0_0_12px_rgba(251,113,133,0.45)]",
    btn: "border-rose-400/70 bg-rose-950/35 text-rose-50 shadow-[0_0_22px_rgba(244,63,94,0.28)]",
    btnHover: "hover:border-rose-300 hover:shadow-[0_0_32px_rgba(244,63,94,0.38)]",
  },
  fuchsia: {
    border: "border-fuchsia-500/90",
    glow: "shadow-[0_0_0_2px_rgba(217,70,239,0.82),0_0_48px_rgba(192,38,211,0.55),0_0_92px_rgba(134,25,143,0.32)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(217,70,239,0.52),rgba(126,34,206,0.38)_48%,transparent_74%)]",
    panel: "bg-[linear-gradient(165deg,rgba(18,6,22,0.94),rgba(6,4,12,0.98))]",
    chip: "border-fuchsia-400/70 bg-fuchsia-950/45 text-fuchsia-100 shadow-[0_0_18px_rgba(232,121,249,0.42)]",
    heading: "text-fuchsia-100 drop-shadow-[0_0_12px_rgba(232,121,249,0.45)]",
    btn: "border-fuchsia-400/70 bg-fuchsia-950/35 text-fuchsia-50 shadow-[0_0_22px_rgba(217,70,239,0.28)]",
    btnHover: "hover:border-fuchsia-300 hover:shadow-[0_0_32px_rgba(217,70,239,0.38)]",
  },
  cyan: {
    border: "border-cyan-500/90",
    glow: "shadow-[0_0_0_2px_rgba(34,211,238,0.82),0_0_48px_rgba(6,182,212,0.55),0_0_92px_rgba(14,116,144,0.32)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(34,211,238,0.48),rgba(14,116,144,0.35)_48%,transparent_74%)]",
    panel: "bg-[linear-gradient(165deg,rgba(4,16,22,0.94),rgba(4,8,14,0.98))]",
    chip: "border-cyan-400/70 bg-cyan-950/45 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.4)]",
    heading: "text-cyan-100 drop-shadow-[0_0_12px_rgba(103,232,249,0.45)]",
    btn: "border-cyan-400/70 bg-cyan-950/35 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.28)]",
    btnHover: "hover:border-cyan-300 hover:shadow-[0_0_32px_rgba(34,211,238,0.38)]",
  },
  blue: {
    border: "border-blue-500/90",
    glow: "shadow-[0_0_0_2px_rgba(59,130,246,0.82),0_0_48px_rgba(37,99,235,0.55),0_0_92px_rgba(30,64,175,0.32)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(59,130,246,0.48),rgba(30,64,175,0.35)_48%,transparent_74%)]",
    panel: "bg-[linear-gradient(165deg,rgba(6,12,28,0.94),rgba(4,8,18,0.98))]",
    chip: "border-blue-400/70 bg-blue-950/45 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.4)]",
    heading: "text-blue-100 drop-shadow-[0_0_12px_rgba(147,197,253,0.45)]",
    btn: "border-blue-400/70 bg-blue-950/35 text-blue-50 shadow-[0_0_22px_rgba(59,130,246,0.28)]",
    btnHover: "hover:border-blue-300 hover:shadow-[0_0_32px_rgba(59,130,246,0.38)]",
  },
};

const CLIP_HUD = "[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]";

function CourseFlowCard({
  course,
  variant,
  isAnchor,
  onContinue
}: {
  course: CourseRec;
  variant: "support" | "focus" | "future";
  isAnchor: boolean;
  onContinue: () => void;
}) {
  const skin = TONE_SKIN[course.tone];
  return (
    <motion.div
      layout={false}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileHover={isAnchor ? { scale: 1.012 } : { scale: 1.022 }}
      className={cn(
        "compact-card-ui group relative flex min-h-[clamp(10.5rem,22vh,14rem)] min-w-0 flex-1 flex-col overflow-hidden border-2 backdrop-blur-[2px]",
        CLIP_HUD,
        skin.border,
        skin.panel,
        skin.glow,
        "transition-[box-shadow,border-color,filter] duration-300",
        isAnchor && "z-[3] hover:!brightness-[1.08]",
        !isAnchor && "z-[1] hover:brightness-[1.05]",
      )}
    >
      <span className={cn("pointer-events-none absolute -inset-3 rounded-[1.05rem] opacity-80 blur-2xl", skin.aura)} aria-hidden />
      <span className="pointer-events-none absolute inset-[5px] rounded-[10px] border border-black/40" aria-hidden />
      <span className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:repeating-linear-gradient(180deg,rgba(0,0,0,0.22)_0px,rgba(0,0,0,0.22)_1px,transparent_1px,transparent_3px)]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[38%] opacity-70 [background:linear-gradient(180deg,rgba(255,255,255,0.06),transparent_72%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-1 flex-col p-[var(--fluid-card-p)]">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("font-mono fluid-text-ui-xs font-black uppercase tracking-[0.2em]", skin.heading)}>
            {variant === "focus" ? "Recommended now" : variant === "support" ? "Supporting" : "Up next"}
          </span>
          {isAnchor ? (
            <span
              className={cn(
                "rounded-md border px-[clamp(0.35rem,1vw+0.1rem,0.5rem)] py-[clamp(0.1rem,0.4vw+0.05rem,0.35rem)] font-mono fluid-text-ui-xs font-black uppercase tracking-[0.18em]",
                skin.chip,
              )}
            >
              Flow
            </span>
          ) : null}
        </div>
        <h3 className="mt-[clamp(0.65rem,1.5vw+0.2rem,1rem)] text-[clamp(0.78rem,0.6vw+0.55rem,1rem)] font-bold leading-snug text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)]">
          {course.title}
        </h3>
        <p className="mt-2 text-[clamp(0.68rem,0.45vw+0.5rem,0.9rem)] leading-relaxed text-white/88">{course.outcome}</p>
        <p className="mt-2 font-mono fluid-text-ui-xs font-bold uppercase tracking-[0.14em] text-emerald-200 [text-shadow:0_0_14px_rgba(52,211,153,0.35)]">
          {course.earningHint}
        </p>
        <div className="mt-auto pt-[clamp(0.85rem,2vw+0.2rem,1.15rem)]">
          <motion.button
            type="button"
            onClick={onContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full rounded-lg border px-[clamp(0.5rem,1.2vw+0.2rem,0.85rem)] py-[clamp(0.45rem,1vw+0.2rem,0.85rem)] font-mono fluid-text-ui-xs font-black uppercase tracking-[0.18em] transition",
              skin.btn,
              skin.btnHover,
            )}
          >
            Continue path
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function CourseFlow({
  goal,
  courses,
  userStepIndex,
  onNavigate
}: {
  goal: GoalId;
  courses: DashboardCourseLike[];
  userStepIndex: number;
  onNavigate: (nav: DashboardNavKey) => void;
}) {
  const go = () => onNavigate("programs");
  const roadmapLen = GOAL_PATH_STAGE_COUNT;
  const maxSlides = Math.min(5, roadmapLen);

  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const stepIdx = Math.min(Math.max(0, userStepIndex), Math.max(0, roadmapLen - 1));

  useEffect(() => {
    setSlideIndex(0);
  }, [goal]);

  useEffect(() => {
    if (paused || maxSlides <= 1) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % maxSlides);
    }, CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [goal, maxSlides, paused]);

  const anchorCourse = useMemo(() => {
    const [a] = opportunityTriplesForStage(goal, stepIdx, courses);
    return a;
  }, [goal, stepIdx, courses]);

  const { movingB, movingC } = useMemo(() => {
    const [, b, c] = opportunityTriplesForStage(goal, slideIndex, courses);
    return { movingB: b, movingC: c };
  }, [goal, slideIndex, courses]);

  return (
    <div
      className="relative mt-[clamp(1.5rem,4vw+0.5rem,2.75rem)] border-t border-[rgba(197,179,88,0.22)] pt-[clamp(1rem,2.5vw+0.35rem,2rem)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex flex-wrap items-end justify-between gap-[clamp(0.65rem,1.8vw+0.2rem,1rem)]">
        <div>
          <div className="font-mono fluid-text-ui-xs font-black uppercase tracking-[0.28em] text-[color:var(--gold-neon)] sm:tracking-[0.3em]">
            Next opportunities
          </div>
          <p className="mt-2 text-[clamp(0.68rem,0.5vw+0.55rem,0.9rem)] leading-relaxed text-white/88">
            Natural progression — earn more and sharpen skills without noise.
          </p>
          {maxSlides > 1 ? (
            <p className="mt-1 font-mono text-[clamp(0.5rem,0.35vw+0.38rem,0.58rem)] uppercase tracking-[0.18em] text-white/55">
              Selected path (left) stays fixed · center and right cycle{paused ? " · paused on hover" : ""}
            </p>
          ) : null}
        </div>
        {maxSlides > 1 ? (
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Opportunity slide (center and right cards)">
            {Array.from({ length: maxSlides }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === slideIndex}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === slideIndex ? "w-7 bg-[color:var(--gold)] shadow-[0_0_12px_rgba(250,204,21,0.45)]" : "w-1.5 bg-white/25 hover:bg-white/40"
                )}
                onClick={() => setSlideIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative mt-[clamp(1rem,2.5vw+0.35rem,1.35rem)] flex min-h-[clamp(10.5rem,22vh,14rem)] min-w-0 flex-col gap-[clamp(0.65rem,1.8vw+0.2rem,1.1rem)] lg:flex-row lg:items-stretch">
        {/* Slot 0: fixed selected course — does not participate in slide animation */}
        <div className="min-w-0 flex-1">
          <CourseFlowCard course={anchorCourse} variant="support" isAnchor onContinue={go} />
        </div>

        <div className="flex justify-center lg:hidden">
          <ArrowConnectorVertical />
        </div>
        <div className="hidden min-h-0 min-w-[2rem] max-w-[3.5rem] flex-1 items-center justify-center lg:flex">
          <ArrowConnectorHorizontal />
        </div>

        {/* Slots 1–2: carousel — only these animate */}
        <div className="relative min-h-[clamp(10.5rem,22vh,14rem)] min-w-0 flex-[1.85] overflow-hidden lg:flex-[2]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${goal}-${slideIndex}`}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -26 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full min-h-[clamp(10.5rem,22vh,14rem)] w-full min-w-0 flex-col gap-[clamp(0.65rem,1.8vw+0.2rem,1.1rem)] lg:flex-row lg:items-stretch"
            >
              <div className="min-w-0 flex-1 lg:min-h-0 lg:flex-[1.12]">
                <CourseFlowCard course={movingB} variant="focus" isAnchor={false} onContinue={go} />
              </div>
              <div className="flex justify-center lg:hidden">
                <ArrowConnectorVertical />
              </div>
              <div className="hidden min-w-[2rem] max-w-[3.5rem] flex-1 items-center justify-center lg:flex">
                <ArrowConnectorHorizontal />
              </div>
              <div className="min-w-0 flex-1">
                <CourseFlowCard course={movingC} variant="future" isAnchor={false} onContinue={go} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
