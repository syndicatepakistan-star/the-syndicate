"use client";

import { useLayoutEffect } from "react";
import { warmGlobeGalleryImages } from "@/lib/mediaWarmCache";

type ProgramsGlobeWarmupProps = {
  imageSrcs: readonly string[];
};

/** Globe tiles first — no background MP4 (frees bandwidth for tile decode). */
export function ProgramsGlobeWarmup({ imageSrcs }: ProgramsGlobeWarmupProps) {
  useLayoutEffect(() => {
    if (!imageSrcs.length) return;
    const priority = imageSrcs.slice(0, 14);
    const rest = imageSrcs.slice(14);
    void warmGlobeGalleryImages(priority).then(() => {
      if (rest.length) void warmGlobeGalleryImages(rest);
    });
  }, [imageSrcs]);

  return null;
}
