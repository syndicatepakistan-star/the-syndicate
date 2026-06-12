"use client";

import { useLayoutEffect } from "react";
import { scheduleMarketingMediaWarmup } from "@/lib/mediaWarmCache";

/** Preloads marketing videos/images once per tab — repeat page visits reuse cache. */
export default function HomeMediaWarmup() {
  useLayoutEffect(() => {
    scheduleMarketingMediaWarmup();
  }, []);

  return null;
}
