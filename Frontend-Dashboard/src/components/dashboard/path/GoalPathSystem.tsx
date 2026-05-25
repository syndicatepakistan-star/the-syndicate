"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { DashboardCourseLike } from "../useDashboardSnapshots";
import { DASHBOARD_PANEL_NEON, getInstructorSlideNeonTheme, neonAccentStyleVars } from "@/data/instructorSlideNeonThemes";
import { type ThemeMode } from "../dashboardPrimitives";
import type { GoalId } from "./goalPathData";
import { ROADMAPS } from "./goalPathData";
import { PathSelector } from "./PathSelector";
import { CourseFlow, type OpportunityCardFrame, type OpportunityContentMode } from "./CourseFlow";
import type { StreamPlaylistListItem } from "@/lib/streaming-api";

const LS_KEY = "dashboarded:goal-path-v1";

type Persisted = {
  goal: GoalId;
  stepByGoal: Partial<Record<GoalId, number>>;
};

function readPersist(): Persisted {
  if (typeof window === "undefined") return { goal: "web_dev", stepByGoal: {} };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { goal: "web_dev", stepByGoal: {} };
    const j = JSON.parse(raw) as Partial<Persisted>;
    const goal = (j.goal as GoalId) ?? "web_dev";
    if (!ROADMAPS[goal]) return { goal: "web_dev", stepByGoal: {} };
    return { goal, stepByGoal: typeof j.stepByGoal === "object" && j.stepByGoal ? j.stepByGoal : {} };
  } catch {
    return { goal: "web_dev", stepByGoal: {} };
  }
}

function writePersist(p: Persisted) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function GoalPathSystem({
  themeMode: _themeMode,
  courses,
  playlists = [],
  opportunityCardFrame = "path",
  opportunityContentMode = "text",
  onContinue,
}: {
  themeMode: ThemeMode;
  courses: DashboardCourseLike[];
  playlists?: StreamPlaylistListItem[];
  /** Public /programs uses Our Methods timeline card chrome on Next opportunities. */
  opportunityCardFrame?: OpportunityCardFrame;
  /** Public /programs: real program posters, prices, and deep links. */
  opportunityContentMode?: OpportunityContentMode;
  onContinue: () => void;
}) {
  const pathNeon = getInstructorSlideNeonTheme(DASHBOARD_PANEL_NEON.path);
  const [persist, setPersist] = useState<Persisted>(() => readPersist());

  useEffect(() => {
    writePersist(persist);
  }, [persist]);

  const goal = persist.goal;
  const maxLen = ROADMAPS[goal].length;
  const currentIndex = Math.max(0, persist.stepByGoal[goal] ?? 0);

  const setGoal = useCallback((g: GoalId) => {
    setPersist((p) => ({ ...p, goal: g }));
  }, []);

  const courseStepIdx = Math.min(currentIndex, Math.max(0, maxLen - 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="dashboard-cyber-neon-panel syndicate-mood-skip-frame cut-frame cyber-frame relative w-full min-w-0 max-w-none overflow-hidden border bg-black fluid-shell-p backdrop-blur-[12px]"
      style={neonAccentStyleVars(pathNeon)}
    >
      <div className="dashboard-cyber-neon-wash pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div className="relative">
        <div className="sm:mt-1">
          <PathSelector selected={goal} onSelect={setGoal} />
        </div>
        <CourseFlow
          goal={goal}
          courses={courses}
          playlists={playlists}
          userStepIndex={courseStepIdx}
          cardFrame={opportunityCardFrame}
          contentMode={opportunityContentMode}
          onContinue={onContinue}
        />
      </div>
    </motion.div>
  );
}
