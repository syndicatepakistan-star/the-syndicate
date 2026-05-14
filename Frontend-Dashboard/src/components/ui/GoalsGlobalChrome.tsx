"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGoalsPanel } from "@/contexts/GoalsPanelContext";
import { FloatingGoalsButton } from "./FloatingGoalsButton";
import { FloatingQuickAccessInGoalsButton } from "./FloatingQuickAccessInGoalsButton";

/**
 * Floating Goals control on private dashboard shell routes.
 * Section-level allow/deny is handled by `shellSectionKey` in `FloatingGoalsButton`.
 */
export function GoalsGlobalChrome() {
  const pathname = usePathname();
  const { closeGoalsPanel } = useGoalsPanel();

  useEffect(() => {
    if (pathname !== "/dashboard") closeGoalsPanel();
  }, [pathname, closeGoalsPanel]);

  if (pathname !== "/dashboard") return null;

  return (
    <>
      <FloatingGoalsButton />
      <FloatingQuickAccessInGoalsButton />
    </>
  );
}
