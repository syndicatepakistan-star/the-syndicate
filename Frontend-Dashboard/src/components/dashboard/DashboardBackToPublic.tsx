"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SEED_FLAG = "dashboard:public-back-seeded";

/** One system-back from dashboard exits to public home (not prior dashboard sections). */
export function DashboardBackToPublic() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.pathname.startsWith("/dashboard")) return;

    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (sessionStorage.getItem(SEED_FLAG) !== "1") {
      window.history.pushState({ syndicatePublicHome: true }, "", "/");
      window.history.pushState({ syndicateDashboardShell: true }, "", current);
      sessionStorage.setItem(SEED_FLAG, "1");
    }

    const onPopState = () => {
      const path = window.location.pathname;
      if (path === "/" || !path.startsWith("/dashboard")) {
        sessionStorage.removeItem(SEED_FLAG);
        router.replace("/");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [router]);

  return null;
}

export function clearDashboardPublicBackSeed() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SEED_FLAG);
}
