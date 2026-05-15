"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState } from "react";
import { Lock, Target, X } from "lucide-react";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/** Goals & Milestones FAB — vivid #FFD700 (matches reference chip) on every shell section. */
const FAB_SHELL_GOALS =
  "cut-frame-sm hud-hover-glow glass-dark transition border border-[rgba(255,215,0,0.48)] bg-black/55 hover:border-[rgba(255,215,0,0.72)] hover:bg-black/62";

export function FloatingGoalsButton() {
  const { openGoalsPanel, isGoalsPanelOpen, isQuickAccessPanelOpen, shellSectionKey, goalsFabLocked } = useGoalsPanel();
  const [lockedOverlayOpen, setLockedOverlayOpen] = useState(false);
  const lockedTitleId = useId();
  const allowed = shellSectionKey != null && shellSectionKey !== "support" && shellSectionKey !== "settings";

  useEffect(() => {
    if (!lockedOverlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLockedOverlayOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lockedOverlayOpen]);

  if (!allowed || isGoalsPanelOpen || isQuickAccessPanelOpen) return null;

  const lockedDialog =
    lockedOverlayOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center sm:p-6"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
              aria-label="Close"
              onClick={() => setLockedOverlayOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={lockedTitleId}
              className="relative z-[1] w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#0a0a0a]/96 p-6 shadow-[0_0_60px_rgba(251,191,36,0.15)]"
            >
              <button
                type="button"
                onClick={() => setLockedOverlayOpen(false)}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-amber-400/50 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/45 bg-amber-500/10 text-amber-100">
                <Lock className="h-7 w-7" strokeWidth={2} aria-hidden />
              </div>
              <h2
                id={lockedTitleId}
                className="pr-10 text-center text-[15px] font-black uppercase tracking-[0.12em] text-amber-100/95"
              >
                Goals &amp; milestones — locked
              </h2>
              <p className="mt-3 text-center text-[13px] leading-relaxed text-white/65">
                Money Mastery unlocks all courses and stream programs. The full Goals &amp; milestones deck (missions,
                reminders, and timeline) is part of{" "}
                <span className="font-semibold text-amber-100/90">The King</span> alongside Syndicate Mode and the
                membership library.
              </p>
              <button
                type="button"
                onClick={() => setLockedOverlayOpen(false)}
                className="mt-6 w-full rounded-xl border border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.1)] py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[color:var(--gold)]/95 transition hover:border-[rgba(255,215,0,0.65)]"
              >
                Got it
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (goalsFabLocked) {
            setLockedOverlayOpen(true);
            return;
          }
          openGoalsPanel();
        }}
        className={cn(
          "group",
          FAB_SHELL_GOALS,
          goalsFabLocked && "opacity-[0.92] saturate-[0.65]",
          "relative z-auto flex items-center justify-center text-left text-[color:var(--goals-milestones-gold)]",
          "motion-reduce:transition-none",
          "h-10 w-10 gap-0 p-0 sm:h-auto sm:w-auto sm:justify-start sm:gap-2.5 sm:px-3 sm:py-2.5",
          "md:max-w-[calc(100vw-1.5rem)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,215,0,0.55)]"
        )}
        aria-label={goalsFabLocked ? "Goals and milestones locked — open details" : "Open Goals and Milestones"}
        aria-haspopup="dialog"
        aria-expanded={goalsFabLocked ? lockedOverlayOpen : false}
      >
        <span
          className={cn(
            "relative grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[rgba(255,215,0,0.52)] bg-black/30 text-[color:var(--goals-milestones-gold)] [filter:drop-shadow(0_0_10px_rgba(255,215,0,0.4))] sm:h-7 sm:w-7"
          )}
        >
          <Target className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} aria-hidden />
          {goalsFabLocked ? (
            <span className="pointer-events-none absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded border border-amber-500/55 bg-black/90 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.35)]">
              <Lock className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "hidden text-[12px] font-extrabold uppercase leading-tight tracking-[0.12em] text-[color:var(--goals-milestones-gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.38),0_1px_0_rgba(0,0,0,0.85)] sm:inline md:text-[13px] md:tracking-[0.14em]"
          )}
        >
          Goals &amp; Milestones
        </span>
        <span className="ml-auto hidden h-px w-[28px] bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.55))] opacity-0 transition group-hover:opacity-100 sm:block" />
      </button>
      {lockedDialog}
    </>
  );
}
