"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardCourseLike } from "@/components/dashboard/useDashboardSnapshots";
import { loadUnlockedDashboardPrograms } from "@/lib/unlockedDashboardPrograms";
import { hasSimpleAuthSessionClient } from "@/lib/portal-api";
import { registerDashboardTabResumeTask } from "@/lib/dashboardTabResume";

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

  const reload = useCallback(async (options?: { forceRefresh?: boolean }) => {
    if (!enabled || !hasSimpleAuthSessionClient()) {
      setPrograms([]);
      setUnlockedCount(0);
      setInProgressCount(0);
      setHydrated(true);
      return;
    }

    try {
      const result = await loadUnlockedDashboardPrograms({
        forceRefresh: options?.forceRefresh,
      });
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
    const onCheckout = () => void reload({ forceRefresh: true });
    window.addEventListener("plan-checkout-confirmed", onCheckout);
    window.addEventListener("playlist-checkout-confirmed", onCheckout);
    return () => {
      window.removeEventListener("plan-checkout-confirmed", onCheckout);
      window.removeEventListener("playlist-checkout-confirmed", onCheckout);
    };
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) return;
    return registerDashboardTabResumeTask(() => {
      void reload({ forceRefresh: true });
    });
  }, [enabled, reload]);

  return { programs, unlockedCount, inProgressCount, hydrated, reload };
}
