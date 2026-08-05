"use client";

import { useEffect } from "react";

const SEED_FLAG = "dashboard:public-back-seeded";

/**
 * Clears the legacy "seed public `/` under dashboard" flag from older builds.
 * History floor (stay on /dashboard until logout) is enforced in DashboardPageClient popstate.
 */
export function DashboardBackToPublic() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(SEED_FLAG);
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}

export function clearDashboardPublicBackSeed() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SEED_FLAG);
}
