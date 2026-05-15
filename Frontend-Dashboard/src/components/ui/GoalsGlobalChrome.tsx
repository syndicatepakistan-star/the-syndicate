"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { FloatingGoalsButton } from "./FloatingGoalsButton";
import { FloatingQuickAccessFab } from "./FloatingQuickAccessFab";

/**
 * Floating shell controls on `/dashboard`: Goals + Quick Access (docked, same chrome as Goals FAB).
 */
export function GoalsGlobalChrome() {
  const pathname = usePathname();
  const { closeGoalsPanel, closeQuickAccessPanel } = useGoalsPanel();

  useEffect(() => {
    if (pathname !== "/dashboard") {
      closeGoalsPanel();
      closeQuickAccessPanel();
    }
  }, [pathname, closeGoalsPanel, closeQuickAccessPanel]);

  if (pathname !== "/dashboard") return null;

  return (
    <div className="pointer-events-none fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] right-3 z-[195] flex flex-row-reverse items-stretch gap-2 sm:bottom-6 sm:right-5 sm:gap-2.5 md:bottom-6 md:right-6">
      <div className="pointer-events-auto">
        <FloatingGoalsButton />
      </div>
      <div className="pointer-events-auto">
        <FloatingQuickAccessFab />
      </div>
    </div>
  );
}
