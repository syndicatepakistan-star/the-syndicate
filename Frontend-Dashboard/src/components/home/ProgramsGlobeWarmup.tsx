"use client";

import { useLayoutEffect } from "react";
import { warmProgramsSectionAssets } from "@/lib/mediaWarmCache";

type ProgramsGlobeWarmupProps = {
  imageSrcs: readonly string[];
};

/** Preloads programs-section MP4 + globe tiles in parallel on first paint. */
export function ProgramsGlobeWarmup({ imageSrcs }: ProgramsGlobeWarmupProps) {
  useLayoutEffect(() => {
    const preloads: HTMLLinkElement[] = [];
    for (const src of imageSrcs) {
      if (!src) continue;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
      preloads.push(link);
    }
    void warmProgramsSectionAssets(imageSrcs);
    return () => {
      for (const link of preloads) {
        link.remove();
      }
    };
  }, [imageSrcs]);

  return null;
}
