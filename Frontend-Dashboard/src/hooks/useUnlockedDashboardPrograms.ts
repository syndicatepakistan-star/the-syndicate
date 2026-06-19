"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardCourseLike } from "@/components/dashboard/useDashboardSnapshots";
import { loadUnlockedDashboardPrograms } from "@/lib/unlockedDashboardPrograms";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";

export function useUnlockedDashboardPrograms(enabled = true): {
  programs: DashboardCourseLike[];
  unlockedCount: number;
  inProgressCount: number;
  hydrated: boolean;
  reload: () => Promise<void>;
} {
  const [programs, setPrograms] = useState<DashboardCourseLike[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !hasSimpleAuthSessionClient()) {
      setPrograms([]);
      setUnlockedCount(0);
      setInProgressCount(0);
      setHydrated(true);
      return;
    }

    try {
      const result = await loadUnlockedDashboardPrograms();
      setPrograms(result.programs);
      setUnlockedCount(result.unlockedCount);
      setInProgressCount(result.inProgressCount);
    } catch {
      setPrograms([]);
      setUnlockedCount(0);
      setInProgressCount(0);
    } finally {
      setHydrated(true);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => void reload();
    const onVis = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const onCheckout = () => void reload();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("plan-checkout-confirmed", onCheckout);
    window.addEventListener("playlist-checkout-confirmed", onCheckout);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("plan-checkout-confirmed", onCheckout);
      window.removeEventListener("playlist-checkout-confirmed", onCheckout);
    };
  }, [enabled, reload]);

  return { programs, unlockedCount, inProgressCount, hydrated, reload };
}
