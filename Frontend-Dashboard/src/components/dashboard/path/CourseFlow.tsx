"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CourseRec, GoalId, OpportunityTone } from "./goalPathData";
import { getPathProgramPool, GOAL_PATH_STAGE_COUNT, opportunityTriplesForStage } from "./goalPathData";
import type { DashboardCourseLike } from "../useDashboardSnapshots";
import { ArrowConnectorHorizontal, ArrowConnectorVertical } from "./ArrowConnector";
import { cn } from "../dashboardPrimitives";
import { ProgramOpportunityCardContent } from "@/components/programs/ProgramOpportunityCardContent";
import { ProgramPlaylistDescriptionModal } from "@/components/programs/ProgramPlaylistDescriptionModal";
import { createPlaylistCheckoutSession, type StreamPlaylistListItem } from "@/lib/streaming-api";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";

const CAROUSEL_MS = 4200;

/** Our Methods–style neon frames (timeline card family). */
const TONE_SKIN: Record<
  OpportunityTone,
  {
    border: string;
    glow: string;
    methodsGlow: string;
    aura: string;
    methodsBg: string;
    stepBorder: string;
    panel: string;
    chip: string;
    heading: string;
    titleText: string;
    btn: string;
    btnHover: string;
  }
> = {
  amber: {
    border: "border-amber-400/90",
    glow: "shadow-[0_0_0_2px_rgba(251,191,36,0.82),0_0_48px_rgba(245,158,11,0.55),0_0_92px_rgba(234,88,12,0.28)]",
    methodsGlow:
      "shadow-[0_0_0_2px_rgba(251,191,36,0.82),0_0_48px_rgba(245,158,11,0.74),0_0_92px_rgba(180,83,9,0.58)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(251,191,36,0.5),rgba(146,64,14,0.35)_48%,transparent_74%)]",
    methodsBg: "bg-[linear-gradient(132deg,rgba(251,191,36,0.72),rgba(217,119,6,0.66),rgba(146,64,14,0.62))]",
    stepBorder: "border-amber-700/90",
    panel: "bg-[linear-gradient(165deg,rgba(24,16,4,0.92),rgba(6,6,4,0.97))]",
    chip: "border-amber-300/70 bg-amber-950/55 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.45)]",
    heading: "text-amber-100 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]",
    titleText: "text-amber-200",
    btn: "border-amber-300/75 bg-amber-950/40 text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.25)]",
    btnHover: "hover:border-amber-200 hover:shadow-[0_0_32px_rgba(251,191,36,0.4)]",
  },
  rose: {
    border: "border-rose-500/90",
    glow: "shadow-[0_0_0_2px_rgba(244,63,94,0.82),0_0_48px_rgba(225,29,72,0.55),0_0_92px_rgba(136,19,55,0.35)]",
    methodsGlow:
      "shadow-[0_0_0_2px_rgba(244,63,94,0.82),0_0_48px_rgba(225,29,72,0.74),0_0_92px_rgba(136,19,55,0.58)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(244,63,94,0.55),rgba(136,19,55,0.42)_48%,transparent_74%)]",
    methodsBg: "bg-[linear-gradient(132deg,rgba(244,63,94,0.72),rgba(190,24,93,0.66),rgba(136,19,55,0.62))]",
    stepBorder: "border-rose-700/90",
    panel: "bg-[linear-gradient(165deg,rgba(22,6,10,0.94),rgba(8,4,6,0.98))]",
    chip: "border-rose-400/70 bg-rose-950/50 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.4)]",
    heading: "text-rose-100 drop-shadow-[0_0_12px_rgba(251,113,133,0.45)]",
    titleText: "text-rose-200",
    btn: "border-rose-400/70 bg-rose-950/35 text-rose-50 shadow-[0_0_22px_rgba(244,63,94,0.28)]",
    btnHover: "hover:border-rose-300 hover:shadow-[0_0_32px_rgba(244,63,94,0.38)]",
  },
  fuchsia: {
    border: "border-fuchsia-500/90",
    glow: "shadow-[0_0_0_2px_rgba(217,70,239,0.82),0_0_48px_rgba(192,38,211,0.55),0_0_92px_rgba(134,25,143,0.32)]",
    methodsGlow:
      "shadow-[0_0_0_2px_rgba(217,70,239,0.82),0_0_48px_rgba(192,38,211,0.74),0_0_92px_rgba(134,25,143,0.58)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(217,70,239,0.52),rgba(126,34,206,0.38)_48%,transparent_74%)]",
    methodsBg: "bg-[linear-gradient(132deg,rgba(217,70,239,0.74),rgba(162,28,175,0.68),rgba(126,34,206,0.64))]",
    stepBorder: "border-fuchsia-700/90",
    panel: "bg-[linear-gradient(165deg,rgba(18,6,22,0.94),rgba(6,4,12,0.98))]",
    chip: "border-fuchsia-400/70 bg-fuchsia-950/45 text-fuchsia-100 shadow-[0_0_18px_rgba(232,121,249,0.42)]",
    heading: "text-fuchsia-100 drop-shadow-[0_0_12px_rgba(232,121,249,0.45)]",
    titleText: "text-fuchsia-200",
    btn: "border-fuchsia-400/70 bg-fuchsia-950/35 text-fuchsia-50 shadow-[0_0_22px_rgba(217,70,239,0.28)]",
    btnHover: "hover:border-fuchsia-300 hover:shadow-[0_0_32px_rgba(217,70,239,0.38)]",
  },
  cyan: {
    border: "border-cyan-500/90",
    glow: "shadow-[0_0_0_2px_rgba(34,211,238,0.82),0_0_48px_rgba(6,182,212,0.55),0_0_92px_rgba(14,116,144,0.32)]",
    methodsGlow:
      "shadow-[0_0_0_2px_rgba(34,211,238,0.82),0_0_48px_rgba(6,182,212,0.74),0_0_92px_rgba(14,116,144,0.58)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(34,211,238,0.48),rgba(14,116,144,0.35)_48%,transparent_74%)]",
    methodsBg: "bg-[linear-gradient(132deg,rgba(34,211,238,0.74),rgba(8,145,178,0.68),rgba(14,116,144,0.64))]",
    stepBorder: "border-cyan-700/90",
    panel: "bg-[linear-gradient(165deg,rgba(4,16,22,0.94),rgba(4,8,14,0.98))]",
    chip: "border-cyan-400/70 bg-cyan-950/45 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.4)]",
    heading: "text-cyan-100 drop-shadow-[0_0_12px_rgba(103,232,249,0.45)]",
    titleText: "text-cyan-200",
    btn: "border-cyan-400/70 bg-cyan-950/35 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.28)]",
    btnHover: "hover:border-cyan-300 hover:shadow-[0_0_32px_rgba(34,211,238,0.38)]",
  },
  blue: {
    border: "border-blue-500/90",
    glow: "shadow-[0_0_0_2px_rgba(59,130,246,0.82),0_0_48px_rgba(37,99,235,0.55),0_0_92px_rgba(30,64,175,0.32)]",
    methodsGlow:
      "shadow-[0_0_0_2px_rgba(59,130,246,0.82),0_0_48px_rgba(37,99,235,0.74),0_0_92px_rgba(30,64,175,0.58)]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(59,130,246,0.48),rgba(30,64,175,0.35)_48%,transparent_74%)]",
    methodsBg: "bg-[linear-gradient(132deg,rgba(59,130,246,0.74),rgba(37,99,235,0.68),rgba(30,64,175,0.64))]",
    stepBorder: "border-blue-700/90",
    panel: "bg-[linear-gradient(165deg,rgba(6,12,28,0.94),rgba(4,8,18,0.98))]",
    chip: "border-blue-400/70 bg-blue-950/45 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.4)]",
    heading: "text-blue-100 drop-shadow-[0_0_12px_rgba(147,197,253,0.45)]",
    titleText: "text-blue-200",
    btn: "border-blue-400/70 bg-blue-950/35 text-blue-50 shadow-[0_0_22px_rgba(59,130,246,0.28)]",
    btnHover: "hover:border-blue-300 hover:shadow-[0_0_32px_rgba(59,130,246,0.38)]",
  },
};

const CLIP_HUD_A =
  "[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]";
const CLIP_HUD_B = "[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]";

/** Equal footprint for all three opportunity cards (public + dashboard). */
const OPPORTUNITY_CARD_SIZE =
  "h-full w-full min-h-[clamp(13rem,26vh,16rem)] max-w-none flex flex-col";
/** +10px vs base program row so Details/Unlock clear the neon frame bottom. */
const PROGRAM_OPPORTUNITY_MIN_H = "min-h-[calc(clamp(18rem,36vh,22rem)+10px)]";
const OPPORTUNITY_CARD_SIZE_PROGRAM =
  `h-full w-full ${PROGRAM_OPPORTUNITY_MIN_H} max-w-none flex flex-col`;

export type OpportunityCardFrame = "path" | "methods";
export type OpportunityContentMode = "text" | "program";

function CourseFlowCard({
  course,
  variant,
  isAnchor,
  cardFrame,
  contentMode,
  playlist,
  cardIndex,
  onContinue,
  onDetails,
  onUnlock,
}: {
  course: CourseRec;
  variant: "support" | "focus" | "future";
  isAnchor: boolean;
  cardFrame: OpportunityCardFrame;
  contentMode: OpportunityContentMode;
  playlist: StreamPlaylistListItem | null;
  cardIndex: number;
  onContinue: () => void;
  onDetails: (playlist: StreamPlaylistListItem) => void;
  onUnlock: (playlist: StreamPlaylistListItem) => void;
}) {
  const skin = TONE_SKIN[course.tone];
  const isMethods = cardFrame === "methods";
  const clip = variant === "focus" ? CLIP_HUD_B : CLIP_HUD_A;
  const isProgramCard = contentMode === "program" && course.programId != null;
  const cardSizeClass = isProgramCard ? OPPORTUNITY_CARD_SIZE_PROGRAM : OPPORTUNITY_CARD_SIZE;

  const label =
    variant === "focus" ? "Recommended" : variant === "support" ? "Supporting" : "Up next";

  const body = isProgramCard ? (
    <ProgramOpportunityCardContent
      course={course}
      variant={variant}
      playlist={playlist}
      skin={{
        heading: skin.heading,
        titleText: skin.titleText,
        infoPanel: skin.chip,
      }}
      cardIndex={cardIndex}
      onDetails={onDetails}
      onUnlock={onUnlock}
    />
  ) : (
    <div className="flex min-h-0 flex-1 flex-col">
      <motion.div className="flex items-center justify-between gap-2">
        <span className={cn("font-mono fluid-path-card-label font-black uppercase tracking-[0.16em] sm:tracking-[0.18em]", skin.heading)}>
          {label}
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
      </motion.div>
      <h3
        className={cn(
          "mt-[clamp(0.65rem,1.5vw+0.2rem,1rem)] line-clamp-3 text-[clamp(0.78rem,0.6vw+0.55rem,1rem)] font-bold leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)]",
          isMethods ? cn("text-zinc-50", skin.titleText) : "text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.65)]",
        )}
      >
        {course.title}
      </h3>
      <p
        className={cn(
          "mt-2 line-clamp-4 flex-1 text-[clamp(0.68rem,0.45vw+0.5rem,0.9rem)] leading-relaxed",
          isMethods ? "text-zinc-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.68)]" : "text-white/88",
        )}
      >
        {course.outcome}
      </p>
      <p className="mt-2 font-mono fluid-text-ui-xs font-bold uppercase tracking-[0.14em] text-emerald-200 [text-shadow:0_0_14px_rgba(52,211,153,0.35)]">
        {course.earningHint}
      </p>
      <motion.div className="mt-auto pt-[clamp(0.85rem,2vw+0.2rem,1.15rem)]">
        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full border px-[clamp(0.5rem,1.2vw+0.2rem,0.85rem)] py-[clamp(0.45rem,1vw+0.2rem,0.85rem)] font-mono fluid-text-ui-xs font-black uppercase tracking-[0.18em] transition",
            isMethods ? "rounded-md" : "rounded-lg",
            skin.btn,
            skin.btnHover,
          )}
        >
          Continue path
        </motion.button>
      </motion.div>
    </div>
  );

  if (isMethods) {
    return (
      <motion.article
        layout={false}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        whileHover={{ scale: isAnchor ? 1.012 : 1.022 }}
        className={cn(
          "compact-card-ui group relative overflow-hidden border-2 p-[clamp(0.55rem,1.2vw+0.15rem,0.85rem)] transition-transform duration-300",
          cardSizeClass,
          clip,
          skin.border,
          skin.methodsGlow,
          isAnchor && "z-[3]",
          !isAnchor && "z-[1]",
        )}
      >
        <span className={cn("pointer-events-none absolute -inset-3 rounded-[1.2rem] opacity-85 blur-2xl", skin.aura)} aria-hidden />
        <span className={cn("pointer-events-none absolute inset-0", skin.methodsBg)} aria-hidden />
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.17] [background-image:repeating-linear-gradient(180deg,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_1px,transparent_3px)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden
        />
        <span className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-black/45" aria-hidden />
        <span
          className={cn("pointer-events-none absolute left-3 top-3 h-7 w-7 border-l-[3px] border-t-[3px] opacity-90", skin.stepBorder)}
          aria-hidden
        />
        <span
          className={cn(
            "pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-[3px] border-r-[3px] opacity-90",
            skin.stepBorder,
          )}
          aria-hidden
        />
        <span
          className={cn(
            "pointer-events-none absolute right-3 top-3 h-2 w-10 rounded-full border bg-[rgba(4,4,12,0.65)]",
            skin.stepBorder,
          )}
          aria-hidden
        />
        <span
          className={cn(
            "pointer-events-none absolute bottom-3 left-3 h-2 w-10 rounded-full border bg-[rgba(4,4,12,0.65)]",
            skin.stepBorder,
          )}
          aria-hidden
        />
        <motion.div
          className={cn(
            "relative z-10 flex min-h-0 flex-col rounded-lg bg-[linear-gradient(165deg,rgba(10,8,18,0.82),rgba(4,6,14,0.9))] p-[clamp(0.55rem,1.2vw+0.15rem,0.85rem)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_0_32px_rgba(0,0,0,0.25)] backdrop-blur-[1px] sm:p-3",
            isProgramCard ? "h-auto w-full justify-start" : "h-full flex-1",
          )}
        >
          {body}
        </motion.div>
      </motion.article>
    );
  }

  return (
    <motion.div
      layout={false}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileHover={isAnchor ? { scale: 1.012 } : { scale: 1.022 }}
      className={cn(
        "compact-card-ui group relative overflow-hidden border-2 backdrop-blur-[2px]",
        cardSizeClass,
        CLIP_HUD_A,
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
      <motion.div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col p-[var(--fluid-card-p)]">{body}</motion.div>
    </motion.div>
  );
}

export function CourseFlow({
  goal,
  courses,
  playlists = [],
  userStepIndex,
  cardFrame = "path",
  contentMode = "text",
  onContinue,
}: {
  goal: GoalId;
  courses: DashboardCourseLike[];
  playlists?: StreamPlaylistListItem[];
  userStepIndex: number;
  cardFrame?: OpportunityCardFrame;
  contentMode?: OpportunityContentMode;
  onContinue: () => void;
}) {
  const router = useRouter();
  const go = onContinue;
  const roadmapLen = GOAL_PATH_STAGE_COUNT;
  const [descriptionModalPlaylist, setDescriptionModalPlaylist] =
    useState<StreamPlaylistListItem | null>(null);

  const playlistById = useMemo(() => {
    const map = new Map<number, StreamPlaylistListItem>();
    for (const pl of playlists) map.set(pl.id, pl);
    return map;
  }, [playlists]);

  const programPool = useMemo(
    () => getPathProgramPool(goal, courses, playlists),
    [goal, courses, playlists],
  );
  const browseCount = Math.max(1, programPool.length);

  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manualBrowse, setManualBrowse] = useState(false);

  const stepIdx = Math.min(Math.max(0, userStepIndex), Math.max(0, roadmapLen - 1));

  const goToSlide = useCallback(
    (index: number) => {
      setManualBrowse(true);
      setSlideIndex(((index % browseCount) + browseCount) % browseCount);
    },
    [browseCount],
  );

  const goPrev = useCallback(() => goToSlide(slideIndex - 1), [goToSlide, slideIndex]);
  const goNext = useCallback(() => goToSlide(slideIndex + 1), [goToSlide, slideIndex]);

  useEffect(() => {
    setSlideIndex(0);
    setManualBrowse(false);
  }, [goal]);

  useEffect(() => {
    if (paused || manualBrowse || browseCount <= 1) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % browseCount);
    }, CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [goal, browseCount, paused, manualBrowse]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (browseCount <= 1) return;
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
  }, [browseCount, goNext, goPrev]);

  const anchorCourse = useMemo(() => {
    const [a] = opportunityTriplesForStage(goal, stepIdx, courses, playlists);
    return a;
  }, [goal, stepIdx, courses, playlists]);

  const { movingB, movingC } = useMemo(() => {
    const [, b, c] = opportunityTriplesForStage(goal, slideIndex, courses, playlists);
    return { movingB: b, movingC: c };
  }, [goal, slideIndex, courses, playlists]);

  const handleDetails = useCallback((playlist: StreamPlaylistListItem) => {
    setDescriptionModalPlaylist(playlist);
  }, []);

  const handleUnlock = useCallback(
    (playlist: StreamPlaylistListItem) => {
      void (async () => {
        if (!hasSimpleAuthSessionClient()) {
          router.push(`/signup?playlist_id=${encodeURIComponent(String(playlist.id))}`);
          return;
        }
        try {
          const payload = await createPlaylistCheckoutSession(playlist.id, {
            returnBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
          });
          const checkoutUrl =
            typeof payload.checkout_url === "string" ? payload.checkout_url.trim() : "";
          if (checkoutUrl) {
            window.location.assign(checkoutUrl);
            return;
          }
          if (payload.is_unlocked) {
            router.push("/dashboard");
            return;
          }
          router.push(`/signup?playlist_id=${encodeURIComponent(String(playlist.id))}`);
        } catch {
          router.push(`/signup?playlist_id=${encodeURIComponent(String(playlist.id))}`);
        }
      })();
    },
    [router],
  );

  const resolvePlaylist = useCallback(
    (course: CourseRec) =>
      course.programId != null ? (playlistById.get(course.programId) ?? null) : null,
    [playlistById],
  );

  const rowMinH =
    contentMode === "program"
      ? PROGRAM_OPPORTUNITY_MIN_H
      : "min-h-[clamp(13rem,26vh,16rem)]";

  return (
    <motion.div
      className="relative mt-[clamp(1.5rem,4vw+0.5rem,2.75rem)] border-t border-[rgba(197,179,88,0.22)] pt-[clamp(1rem,2.5vw+0.35rem,2rem)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setManualBrowse(false);
      }}
    >
      {contentMode === "program" ? (
        <ProgramPlaylistDescriptionModal
          playlist={descriptionModalPlaylist}
          onClose={() => setDescriptionModalPlaylist(null)}
        />
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-[clamp(0.65rem,1.8vw+0.2rem,1rem)]">
        <div>
          <div className="public-heading-lightning public-heading-lightning--amber font-mono fluid-path-section-heading font-black uppercase tracking-[0.22em] sm:tracking-[0.24em]">
            Next Opportunities
          </div>
          <p className="mt-2 text-[clamp(0.85rem,0.55vw+0.68rem,1.1rem)] leading-relaxed text-white/88 sm:text-[clamp(0.92rem,0.5vw+0.72rem,1.15rem)]">
            Natural progression — earn more and sharpen skills without noise.
          </p>
          {browseCount > 1 ? (
            <p className="mt-1 font-mono text-[clamp(0.5rem,0.35vw+0.38rem,0.58rem)] uppercase tracking-[0.18em] text-white/55">
              Supporting (left) stays on your step · use arrows or dots to browse {browseCount} programs in this path
              {manualBrowse ? " · manual" : paused ? " · auto paused on hover" : ""}
            </p>
          ) : null}
        </div>
        {browseCount > 1 ? (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={goPrev}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[rgba(255,215,0,0.45)] bg-black/50 text-[color:var(--gold-neon)] shadow-[0_0_16px_rgba(255,215,0,0.18)] transition hover:border-[rgba(255,215,0,0.7)] hover:bg-black/65 hover:shadow-[0_0_22px_rgba(255,215,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,215,0,0.55)]"
              aria-label="Previous programs in this path"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.4} aria-hidden />
            </button>
            <span className="min-w-[4.5rem] text-center font-mono text-[11px] font-bold tabular-nums uppercase tracking-[0.12em] text-white/70 sm:text-xs">
              {slideIndex + 1} / {browseCount}
            </span>
            <button
              type="button"
              onClick={goNext}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[rgba(255,215,0,0.45)] bg-black/50 text-[color:var(--gold-neon)] shadow-[0_0_16px_rgba(255,215,0,0.18)] transition hover:border-[rgba(255,215,0,0.7)] hover:bg-black/65 hover:shadow-[0_0_22px_rgba(255,215,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,215,0,0.55)]"
              aria-label="Next programs in this path"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.4} aria-hidden />
            </button>
            <div
              className="max-w-[min(100%,14rem)] overflow-x-auto overflow-y-hidden py-0.5 [scrollbar-color:rgba(255,215,0,0.35)_transparent] [scrollbar-width:thin] sm:max-w-[18rem]"
              role="tablist"
              aria-label="Browse programs in this path"
            >
              <div className="flex items-center gap-1.5 px-0.5">
                {programPool.map((prog, i) => (
                  <button
                    key={prog.programId ?? prog.id}
                    type="button"
                    role="tab"
                    aria-selected={i === slideIndex}
                    title={prog.title}
                    className={cn(
                      "h-1.5 shrink-0 rounded-full transition-all duration-300",
                      i === slideIndex
                        ? "w-7 bg-[color:var(--gold)] shadow-[0_0_12px_rgba(250,204,21,0.45)]"
                        : "w-1.5 bg-white/25 hover:w-2 hover:bg-white/40",
                    )}
                    onClick={() => goToSlide(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {browseCount > 1 ? (
        <div
          className="relative mt-3 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-color:rgba(255,215,0,0.35)_rgba(0,0,0,0.2)] [scrollbar-width:thin]"
          aria-label="Program list for this path"
        >
          <div className="flex w-max min-w-full gap-2 pr-1">
            {programPool.map((prog, i) => (
              <button
                key={prog.programId ?? prog.id}
                type="button"
                onClick={() => goToSlide(i)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-2 text-left font-mono text-[10px] font-bold uppercase leading-snug tracking-[0.08em] transition sm:text-[11px]",
                  i === slideIndex
                    ? "border-[rgba(255,215,0,0.65)] bg-[rgba(255,215,0,0.12)] text-[color:var(--gold-neon)] shadow-[0_0_18px_rgba(255,215,0,0.22)]"
                    : "border-white/20 bg-black/40 text-white/65 hover:border-[rgba(255,215,0,0.35)] hover:text-white/88",
                )}
              >
                {prog.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative mt-[clamp(1rem,2.5vw+0.35rem,1.35rem)] grid min-w-0 gap-[clamp(0.65rem,1.8vw+0.2rem,1.1rem)]",
          "grid-cols-1",
          "lg:grid-cols-[minmax(0,1fr)_minmax(2rem,3.5rem)_minmax(0,1fr)_minmax(2rem,3.5rem)_minmax(0,1fr)]",
          "lg:items-stretch",
        )}
      >
        <div className={cn("flex min-w-0 flex-col lg:col-start-1 lg:row-start-1", rowMinH)}>
          <CourseFlowCard
            course={anchorCourse}
            variant="support"
            isAnchor
            cardFrame={cardFrame}
            contentMode={contentMode}
            playlist={resolvePlaylist(anchorCourse)}
            cardIndex={0}
            onContinue={go}
            onDetails={handleDetails}
            onUnlock={handleUnlock}
          />
        </div>

        <div className="flex justify-center lg:col-start-2 lg:row-start-1 lg:hidden">
          <ArrowConnectorVertical />
        </div>
        <div className={cn("hidden items-center justify-center lg:col-start-2 lg:flex lg:row-start-1", rowMinH)}>
          <ArrowConnectorHorizontal className="w-full max-w-[3.5rem]" />
        </div>

        <div className={cn("relative min-w-0 lg:col-start-3 lg:row-start-1", rowMinH)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${goal}-${slideIndex}-b`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex h-full w-full min-w-0 flex-col"
            >
              <CourseFlowCard
                course={movingB}
                variant="focus"
                isAnchor={false}
                cardFrame={cardFrame}
                contentMode={contentMode}
                playlist={resolvePlaylist(movingB)}
                cardIndex={1}
                onContinue={go}
                onDetails={handleDetails}
                onUnlock={handleUnlock}
              />
            </motion.div>
            </AnimatePresence>
        </div>

        <div className="flex justify-center lg:col-start-4 lg:row-start-1 lg:hidden">
          <ArrowConnectorVertical />
        </div>
        <div className={cn("hidden items-center justify-center lg:col-start-4 lg:flex lg:row-start-1", rowMinH)}>
          <ArrowConnectorHorizontal className="w-full max-w-[3.5rem]" />
        </div>

        <div className={cn("relative min-w-0 lg:col-start-5 lg:row-start-1", rowMinH)}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${goal}-${slideIndex}-c`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex h-full w-full min-w-0 flex-col"
              >
                <CourseFlowCard
                  course={movingC}
                  variant="future"
                  isAnchor={false}
                  cardFrame={cardFrame}
                  contentMode={contentMode}
                  playlist={resolvePlaylist(movingC)}
                  cardIndex={2}
                  onContinue={go}
                  onDetails={handleDetails}
                  onUnlock={handleUnlock}
                />
              </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
