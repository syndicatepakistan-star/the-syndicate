"use client";

import { LayoutGrid } from "lucide-react";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { cn } from "@/components/dashboard/dashboardPrimitives";

/** Matches {@link FloatingGoalsButton} gold HUD chrome. */
const FAB_SHELL =
  "cut-frame-sm hud-hover-glow glass-dark transition border border-[rgba(255,215,0,0.48)] bg-black/55 hover:border-[rgba(255,215,0,0.72)] hover:bg-black/62";

export function FloatingQuickAccessFab() {
  const { openQuickAccessPanel, isGoalsPanelOpen, isQuickAccessPanelOpen, shellSectionKey } = useGoalsPanel();
  const allowed = shellSectionKey != null && shellSectionKey !== "support" && shellSectionKey !== "settings";

  if (!allowed || isGoalsPanelOpen || isQuickAccessPanelOpen) return null;

  return (
    <button
      type="button"
      onClick={() => openQuickAccessPanel()}
      className={cn(
        "group",
        FAB_SHELL,
        "relative z-auto flex items-center justify-center text-left text-[color:var(--goals-milestones-gold)]",
        "motion-reduce:transition-none",
        "h-10 w-10 gap-0 p-0 sm:h-auto sm:w-auto sm:justify-start sm:gap-2.5 sm:px-3 sm:py-2.5",
        "md:max-w-[calc(100vw-1.5rem)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,215,0,0.55)]"
      )}
      aria-label="Open Quick Access"
      aria-haspopup="dialog"
    >
      <span
        className={cn(
          "relative grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[rgba(255,215,0,0.52)] bg-black/30 text-[color:var(--goals-milestones-gold)] [filter:drop-shadow(0_0_10px_rgba(255,215,0,0.4))] sm:h-7 sm:w-7"
        )}
      >
        <LayoutGrid className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
      <span
        className={cn(
          "hidden text-[12px] font-extrabold uppercase leading-tight tracking-[0.12em] text-[color:var(--goals-milestones-gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.38),0_1px_0_rgba(0,0,0,0.85)] sm:inline md:text-[13px] md:tracking-[0.14em]"
        )}
      >
        Quick Access
      </span>
      <span className="ml-auto hidden h-px w-[28px] bg-[linear-gradient(270deg,transparent,rgba(255,215,0,0.55))] opacity-0 transition group-hover:opacity-100 sm:block" />
    </button>
  );
}
