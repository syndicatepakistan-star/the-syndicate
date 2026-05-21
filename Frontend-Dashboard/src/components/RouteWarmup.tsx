"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { prefetchMarketingRoutes } from "@/lib/marketing-nav-routes";

/** Prefetch marketing routes on load so navbar clicks reuse cached RSC payloads. */
export default function RouteWarmup() {
  const router = useRouter();

  useEffect(() => {
    prefetchMarketingRoutes(router);
    const retry = window.setTimeout(() => prefetchMarketingRoutes(router), 120);
    return () => window.clearTimeout(retry);
  }, [router]);

  return null;
}
