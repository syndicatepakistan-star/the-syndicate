"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { ThemeMode } from "@/components/dashboard/dashboardPrimitives";
import { useActivityTimeline } from "@/contexts/ActivityTimelineContext";

export type GoalsPanelContextValue = {
  isGoalsPanelOpen: boolean;
  openGoalsPanel: () => void;
  closeGoalsPanel: () => void;
  toggleGoalsPanel: () => void;
  /** Quick Access tools overlay (same shell as Goals FAB). */
  isQuickAccessPanelOpen: boolean;
  openQuickAccessPanel: () => void;
  closeQuickAccessPanel: () => void;
  /** Main shell nav key (e.g. dashboard, programs) — drives FAB visibility */
  shellSectionKey: string | null;
  setShellSectionKey: (key: string | null) => void;
  themeMode: ThemeMode;
  setPanelThemeMode: (mode: ThemeMode) => void;
  /** Money Mastery tier: Goals FAB is visible but locked (upgrade to The Knight for full access). */
  goalsFabLocked: boolean;
  setGoalsFabLocked: (locked: boolean) => void;
};

const GoalsPanelContext = createContext<GoalsPanelContextValue | null>(null);

export function GoalsPanelProvider({ children }: { children: ReactNode }) {
  const { recordEvent } = useActivityTimeline();
  const [isGoalsPanelOpen, setGoalsPanelOpen] = useState(false);
  const [isQuickAccessPanelOpen, setQuickAccessPanelOpen] = useState(false);
  const [shellSectionKey, setShellSectionKey] = useState<string | null>(null);
  const [themeMode, setPanelThemeMode] = useState<ThemeMode>("default");
  const [goalsFabLocked, setGoalsFabLocked] = useState(false);

  const closeQuickAccessPanel = useCallback(() => setQuickAccessPanelOpen(false), []);

  const openGoalsPanel = useCallback(() => {
    if (goalsFabLocked) return;
    setQuickAccessPanelOpen(false);
    setGoalsPanelOpen(true);
    recordEvent({
      category: "system",
      title: "Opened Goals & Milestones",
      detail: "Mission deck & timeline overlay",
      moreDetails:
        "You opened the floating Goals & Milestones panel: missions, automatic lead-up reminders, and notes."
    });
  }, [goalsFabLocked, recordEvent]);
  const closeGoalsPanel = useCallback(() => setGoalsPanelOpen(false), []);
  const toggleGoalsPanel = useCallback(() => setGoalsPanelOpen((v) => !v), []);

  const openQuickAccessPanel = useCallback(() => {
    setGoalsPanelOpen(false);
    setQuickAccessPanelOpen(true);
    recordEvent({
      category: "system",
      title: "Opened Quick Access",
      detail: "Tools overlay",
      moreDetails: "You opened the floating Quick Access panel from the dashboard shell."
    });
  }, [recordEvent]);

  const value = useMemo<GoalsPanelContextValue>(
    () => ({
      isGoalsPanelOpen,
      openGoalsPanel,
      closeGoalsPanel,
      toggleGoalsPanel,
      isQuickAccessPanelOpen,
      openQuickAccessPanel,
      closeQuickAccessPanel,
      shellSectionKey,
      setShellSectionKey,
      themeMode,
      setPanelThemeMode,
      goalsFabLocked,
      setGoalsFabLocked
    }),
    [
      isGoalsPanelOpen,
      openGoalsPanel,
      closeGoalsPanel,
      toggleGoalsPanel,
      isQuickAccessPanelOpen,
      openQuickAccessPanel,
      closeQuickAccessPanel,
      shellSectionKey,
      themeMode,
      goalsFabLocked
    ]
  );

  return <GoalsPanelContext.Provider value={value}>{children}</GoalsPanelContext.Provider>;
}

export function useGoalsPanel() {
  const ctx = useContext(GoalsPanelContext);
  if (!ctx) {
    throw new Error("useGoalsPanel must be used within GoalsPanelProvider");
  }
  return ctx;
}
