import { parseStackCourseAccess, parseStackCourseTitle } from "@/lib/quizArchetypeCourseLinks";

export type CourseNeonTheme =
  | "neon-gold"
  | "neon-purple"
  | "neon-pink"
  | "neon-orange"
  | "neon-green"
  | "neon-red"
  | "neon-cyan";

/** Per-course neon accent for Section C recommendation rows. */
export function resolveCourseNeonTheme(courseLine: string): CourseNeonTheme {
  const access = parseStackCourseAccess(courseLine);
  const title = parseStackCourseTitle(courseLine).toLowerCase();

  if (access === "free" || title.includes("zero to 1 million") || title.includes("9 to 5 exit")) {
    return "neon-green";
  }
  if (title.includes("business warfare")) return "neon-red";
  if (title.includes("trading") && title.includes("technical")) return "neon-gold";
  if (title.includes("ai content automation")) return "neon-pink";
  if (title.includes("unreal engine")) return "neon-purple";
  if (title.includes("micro business protocol")) return "neon-orange";
  if (title.includes("risk and uncertainty")) return "neon-purple";
  if (title.includes("claude") || title.includes("anti gravity") || title.includes("agents")) {
    return "neon-cyan";
  }
  if (title.includes("wordpress") || title.includes("framer")) return "neon-orange";
  if (title.includes("print on demand") || title.includes("amazon kdp") || title === "amazon kdp") {
    return "neon-pink";
  }
  if (title.includes("automation")) return "neon-cyan";
  return "neon-gold";
}

export function courseActionButtonTheme(
  courseLine: string,
  isFree: boolean
): CourseNeonTheme {
  return isFree ? "neon-green" : resolveCourseNeonTheme(courseLine);
}
