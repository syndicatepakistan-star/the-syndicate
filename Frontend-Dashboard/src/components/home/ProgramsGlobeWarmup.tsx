"use client";

import { useLayoutEffect } from "react";
import { warmProgramsSectionAssets } from "@/lib/mediaWarmCache";

type ProgramsGlobeWarmupProps = {
  imageSrcs: readonly string[];
};

/** Preloads programs-section MP4 + globe tiles in parallel on first paint (no <link preload> — avoids unused-preload warnings). */
export function ProgramsGlobeWarmup({ imageSrcs }: ProgramsGlobeWarmupProps) {
  useLayoutEffect(() => {
    void warmProgramsSectionAssets(imageSrcs);
  }, [imageSrcs]);

  return null;
}
