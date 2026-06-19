import { parseStackCourseAccess, parseStackCourseTitle } from "@/lib/quizArchetypeCourseLinks";

export type CourseNeonTheme =
  | "neon-gold"
  | "neon-purple"
  | "neon-pink"
  | "neon-orange"
  | "neon-green"
  | "neon-red"
  | "neon-cyan"
  | "neon-blue"
  | "neon-ai-content";

/** Weapon / business-model rows cycle pink → purple → gold → blue (Section C + map). */
export const WEAPON_COURSE_NEON_ROTATION: readonly CourseNeonTheme[] = [
  "neon-pink",
  "neon-purple",
  "neon-gold",
  "neon-blue",
];

export function resolveWeaponNeonTheme(index: number): CourseNeonTheme {
  return WEAPON_COURSE_NEON_ROTATION[index % WEAPON_COURSE_NEON_ROTATION.length];
}

/** Per-course neon accent for shield / protocol / psychology rows (not weapon lists). */
export function resolveCourseNeonTheme(courseLine: string): CourseNeonTheme {
  const access = parseStackCourseAccess(courseLine);
  const title = parseStackCourseTitle(courseLine).toLowerCase();

  if (access === "free" || title.includes("zero to 1 million") || title.includes("9 to 5 exit")) {
    return "neon-green";
  }
  if (title.includes("business warfare")) return "neon-red";
  if (title.includes("trading") && title.includes("technical")) return "neon-gold";
  if (title.includes("ai content automation")) return "neon-ai-content";
  if (title.includes("unreal engine")) return "neon-purple";
  if (title.includes("micro business protocol")) return "neon-orange";
  if (title.includes("risk and uncertainty")) return "neon-purple";
  if (title.includes("automation")) return "neon-cyan";
  return "neon-gold";
}

export function courseActionButtonTheme(
  courseLine: string,
  isFree: boolean,
  rowThemeOverride?: CourseNeonTheme
): CourseNeonTheme {
  if (isFree) return "neon-green";
  return rowThemeOverride ?? resolveCourseNeonTheme(courseLine);
}
