"use client";

import { LayoutGrid } from "lucide-react";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import {
  DASHBOARD_FAB_ICON,
  DASHBOARD_FAB_ICON_GLYPH,
  DASHBOARD_FAB_LABEL,
  DASHBOARD_FAB_SHELL
} from "@/components/ui/dashboardFabChrome";

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
        DASHBOARD_FAB_SHELL,
        "relative z-auto flex items-center justify-center text-left text-[color:var(--goals-milestones-gold)]/75",
        "motion-reduce:transition-none",
        "h-10 w-10 gap-0 p-0 sm:h-auto sm:w-auto sm:justify-start sm:gap-2.5 sm:px-3 sm:py-2.5",
        "md:max-w-[calc(100vw-1.5rem)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,215,0,0.55)]"
      )}
      aria-label="Open Quick Access"
      aria-haspopup="dialog"
    >
      <span className={DASHBOARD_FAB_ICON}>
        <LayoutGrid className={DASHBOARD_FAB_ICON_GLYPH} strokeWidth={2.2} aria-hidden />
      </span>
      <span className={DASHBOARD_FAB_LABEL}>
        Quick Access
      </span>
      <span className="ml-auto hidden h-px w-[28px] bg-[linear-gradient(270deg,transparent,rgba(255,215,0,0.35))] opacity-0 transition group-hover:opacity-70 sm:block" />
    </button>
  );
}
