"use client";

import { useLayoutEffect } from "react";
import { warmProgramsSectionAssets } from "@/lib/mediaWarmCache";

type ProgramsGlobeWarmupProps = {
  imageSrcs: readonly string[];
};

let programsSectionWarmStarted = false;

/** Preloads programs-section MP4 + globe tiles once per session (avoids repeat work on home revisit). */
export function ProgramsGlobeWarmup({ imageSrcs }: ProgramsGlobeWarmupProps) {
  useLayoutEffect(() => {
    if (programsSectionWarmStarted) return;
    programsSectionWarmStarted = true;
    void warmProgramsSectionAssets(imageSrcs);
  }, [imageSrcs]);

  return null;
}
