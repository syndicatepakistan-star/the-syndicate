import type { CSSProperties } from "react";

/** Dystopian HUD accent — border, icon, and heading share the same hue. */
export type InstructorSlideNeonTheme = {
  neon: string;
  neonBright: string;
  border: string;
  glow: string;
  haze: string;
};

/**
 * Dark dystopian palette (sidebar + instructor slideshow).
 * Muted bases with ember / rust / toxic / void tones — lightning glow via CSS vars.
 */
export const INSTRUCTOR_SLIDE_NEON_THEMES: readonly InstructorSlideNeonTheme[] = [
  { neon: "#0d6b6a", neonBright: "#3eb8b5", border: "rgba(13, 107, 106, 0.9)", glow: "rgba(62, 184, 181, 0.5)", haze: "rgba(13, 107, 106, 0.22)" },
  { neon: "#8b3a2a", neonBright: "#d97757", border: "rgba(139, 58, 42, 0.9)", glow: "rgba(217, 119, 87, 0.48)", haze: "rgba(139, 58, 42, 0.2)" },
  { neon: "#5c2d82", neonBright: "#b07fd4", border: "rgba(92, 45, 130, 0.9)", glow: "rgba(176, 127, 212, 0.46)", haze: "rgba(92, 45, 130, 0.2)" },
  { neon: "#1f5c38", neonBright: "#4caf7a", border: "rgba(31, 92, 56, 0.9)", glow: "rgba(76, 175, 122, 0.45)", haze: "rgba(31, 92, 56, 0.2)" },
  { neon: "#a84a12", neonBright: "#e8954a", border: "rgba(168, 74, 18, 0.9)", glow: "rgba(232, 149, 74, 0.5)", haze: "rgba(168, 74, 18, 0.22)" },
  { neon: "#8c2638", neonBright: "#e06b7f", border: "rgba(140, 38, 56, 0.9)", glow: "rgba(224, 107, 127, 0.48)", haze: "rgba(140, 38, 56, 0.2)" },
  { neon: "#1e4a7a", neonBright: "#5a9fd4", border: "rgba(30, 74, 122, 0.9)", glow: "rgba(90, 159, 212, 0.46)", haze: "rgba(30, 74, 122, 0.2)" },
  { neon: "#4a3080", neonBright: "#9a7fd8", border: "rgba(74, 48, 128, 0.9)", glow: "rgba(154, 127, 216, 0.45)", haze: "rgba(74, 48, 128, 0.2)" },
  { neon: "#0f5c5a", neonBright: "#3aaea8", border: "rgba(15, 92, 90, 0.9)", glow: "rgba(58, 174, 168, 0.45)", haze: "rgba(15, 92, 90, 0.2)" },
  { neon: "#9a3b18", neonBright: "#e07840", border: "rgba(154, 59, 24, 0.9)", glow: "rgba(224, 120, 64, 0.5)", haze: "rgba(154, 59, 24, 0.22)" },
  { neon: "#7a2860", neonBright: "#d070b0", border: "rgba(122, 40, 96, 0.9)", glow: "rgba(208, 112, 176, 0.46)", haze: "rgba(122, 40, 96, 0.2)" },
  { neon: "#3d5c22", neonBright: "#8fbc5a", border: "rgba(61, 92, 34, 0.9)", glow: "rgba(143, 188, 90, 0.44)", haze: "rgba(61, 92, 34, 0.2)" },
  { neon: "#243878", neonBright: "#6a94d8", border: "rgba(36, 56, 120, 0.9)", glow: "rgba(106, 148, 216, 0.46)", haze: "rgba(36, 56, 120, 0.2)" },
  { neon: "#7a1f32", neonBright: "#d85a72", border: "rgba(122, 31, 50, 0.9)", glow: "rgba(216, 90, 114, 0.48)", haze: "rgba(122, 31, 50, 0.2)" },
  { neon: "#1a4d3a", neonBright: "#48a882", border: "rgba(26, 77, 58, 0.9)", glow: "rgba(72, 168, 130, 0.45)", haze: "rgba(26, 77, 58, 0.2)" },
  { neon: "#353080", neonBright: "#7a74d8", border: "rgba(53, 48, 128, 0.9)", glow: "rgba(122, 116, 216, 0.45)", haze: "rgba(53, 48, 128, 0.2)" },
  { neon: "#7a5c14", neonBright: "#d4a84a", border: "rgba(122, 92, 20, 0.9)", glow: "rgba(212, 168, 74, 0.48)", haze: "rgba(122, 92, 20, 0.2)" },
] as const;

export function getInstructorSlideNeonTheme(slideIndex: number): InstructorSlideNeonTheme {
  const themes = INSTRUCTOR_SLIDE_NEON_THEMES;
  return themes[((slideIndex % themes.length) + themes.length) % themes.length]!;
}

/** Shared CSS variables for neon borders, icons, and labels (slideshow + sidebar). */
export function neonAccentStyleVars(theme: InstructorSlideNeonTheme): CSSProperties {
  return {
    ["--neon-accent" as string]: theme.neon,
    ["--neon-accent-bright" as string]: theme.neonBright,
    ["--neon-accent-border" as string]: theme.border,
    ["--neon-accent-glow" as string]: theme.glow,
    ["--neon-accent-haze" as string]: theme.haze,
    ["--instructor-neon" as string]: theme.neon,
    ["--instructor-neon-bright" as string]: theme.neonBright,
    ["--instructor-neon-border" as string]: theme.border,
    ["--instructor-neon-glow" as string]: theme.glow,
    ["--instructor-neon-haze" as string]: theme.haze,
  };
}

/** @deprecated Use neonAccentStyleVars */
export const instructorSlideNeonStyleVars = neonAccentStyleVars;
