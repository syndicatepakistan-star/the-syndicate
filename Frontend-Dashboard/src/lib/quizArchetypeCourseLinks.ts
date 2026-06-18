import catalogEntries from "@/data/stream-playlist-catalog.json";
import { planOfferDeepLink, programPlaylistDeepLink, type GlobePackKey } from "@/lib/programPlaylistThumbnails";

type CatalogEntry = { id: number; title: string };

const CATALOG = catalogEntries as CatalogEntry[];

/** Quiz funnel catalog title → published StreamPlaylist title (mirrors logic.py). */
const QUIZ_COURSE_TO_PLAYLIST_TITLE: Record<string, string> = {
  // Business models (WEAPON_TO_PLAYLIST)
  "ai automation": "AI Automations",
  "ai content automation": "Faceless YouTube AI Content Creator Course",
  "n8n ai automation": "AI Automations",
  "building ai agents with claude and anti gravity": "How To Build A.I Agents",
  "app building using flutter": "App Building (using Flutter)",
  "python full course": "Python Programming",
  "amazon kdp": "Book Publishing On Amazon (KINDLE)",
  "build a real react app": "Building Apps using React JS",
  "building games using unreal engine": "Building Games Using Unreal Engine",
  "framer crash course": "Framer Crash Course",
  "wordpress blog": "WordPress Blog",
  "print on demand": "Print On Demand Clothing",
  "full canva tutorial": "Graphics Design Using Canva",
  "trading advanced technical analysis": "Crypto Trading with Technical Analysis Course",
  // Psychology (PSYCHOLOGY_TO_PLAYLIST)
  "business warfare": "Business Warfare",
  "the micro business protocol": "Micro Business Protocols",
  "micro business protocols": "Micro Business Protocols",
  "money philosophy": "Syndicate Money Philosophy",
  "13 syndicate business rule": "Syndicate 13 Business Rules",
  "zero to 1 million": "Zero to One Million",
  "9 to 5 exit strategy": "The 9 to 5 Exit Strategy",
  "compound effect": "The Compound Effect",
  "hustle hard": "Hustle Hard",
  "mastering consistency": "Mastering Consistency",
  "secret to transformation": "The Secret To Transformation",
  "mastering risk and uncertainty": "Mastering Risk and Uncertainty",
};

/** Mid-ticket Syndicate Elite pack deep links for weapon business models. */
const MID_TICKET_PACK_BY_COURSE: Record<string, GlobePackKey> = {
  "trading advanced technical analysis": "trading_technical_analysis",
};

/** Stable DOM ids for Section C unlock CTAs (analytics / testing hooks). */
export const QUIZ_STACK_UNLOCK_BUTTON_IDS: Record<string, string> = {
  "the micro business protocol": "quiz-unlock-shield-micro-business-protocol",
  "micro business protocols": "quiz-unlock-shield-micro-business-protocol",
  "business warfare": "quiz-unlock-protocol-business-warfare",
  "mastering risk and uncertainty": "quiz-unlock-protocol-mastering-risk-uncertainty",
  "trading advanced technical analysis": "quiz-unlock-weapon-trading-technical-analysis",
};

const KNOWN_FREE_STACK_COURSES = new Set(["zero to 1 million", "9 to 5 exit strategy"]);

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PLAYLIST_TITLE_TO_ID = new Map(
  CATALOG.map((entry) => [normalizeTitle(entry.title), entry.id] as const)
);

export function resolveQuizCatalogCourseProgramId(courseName: string): number | undefined {
  const key = courseName.trim().toLowerCase();
  const mappedTitle = QUIZ_COURSE_TO_PLAYLIST_TITLE[key];
  if (mappedTitle) {
    const id = PLAYLIST_TITLE_TO_ID.get(normalizeTitle(mappedTitle));
    if (id) return id;
  }
  const direct = PLAYLIST_TITLE_TO_ID.get(normalizeTitle(courseName));
  if (direct) return direct;
  for (const entry of CATALOG) {
    const entryNorm = normalizeTitle(entry.title);
    const queryNorm = normalizeTitle(courseName);
    if (entryNorm === queryNorm || entryNorm.includes(queryNorm) || queryNorm.includes(entryNorm)) {
      return entry.id;
    }
  }
  return undefined;
}

export function buildUnlockNowProgramsHref(courseName: string): string | undefined {
  const titleKey = normalizeTitle(parseStackCourseTitle(courseName));
  const pack = MID_TICKET_PACK_BY_COURSE[titleKey];
  if (pack) return planOfferDeepLink(pack);
  const programId = resolveQuizCatalogCourseProgramId(courseName);
  if (!programId) return undefined;
  return programPlaylistDeepLink(programId);
}

export function resolveQuizStackUnlockButtonId(courseName: string): string | undefined {
  return QUIZ_STACK_UNLOCK_BUTTON_IDS[normalizeTitle(parseStackCourseTitle(courseName))];
}

export type ArchetypeMapLineCategory = "business" | "paid_psychology" | "free_psychology" | "other";

export function classifyArchetypeMapLine(line: string): ArchetypeMapLineCategory | null {
  const trimmed = line.trim();
  if (trimmed.startsWith("Business Models:")) return "business";
  if (trimmed.startsWith("Psychology (Paid")) return "paid_psychology";
  if (trimmed.startsWith("Psychology (Free")) return "free_psychology";
  return null;
}

export function isArchetypeCourseMapSection(sectionTitle: string): boolean {
  const t = sectionTitle.trim().toLowerCase();
  return t.includes("archetype course map") || t.startsWith("section e");
}

export type ExecutionStackLineCategory = "weapon" | "shield" | "protocol" | "other";

export function classifyExecutionStackLine(line: string): ExecutionStackLineCategory | null {
  const trimmed = line.trim();
  if (trimmed.startsWith("1. THE WEAPON")) return "weapon";
  if (trimmed.startsWith("2. THE SHIELD")) return "shield";
  if (trimmed.startsWith("3. THE PROTOCOL")) return "protocol";
  return null;
}

export function isExecutionStackSection(sectionTitle: string): boolean {
  const t = sectionTitle.trim().toLowerCase();
  return t.includes("execution stack") || t.startsWith("section c");
}

export function executionStackCategoryToActionCategory(
  category: ExecutionStackLineCategory,
  courseName: string
): ArchetypeMapLineCategory {
  const titleKey = normalizeTitle(parseStackCourseTitle(courseName));
  const access = parseStackCourseAccess(courseName);
  if (access === "free" || KNOWN_FREE_STACK_COURSES.has(titleKey)) return "free_psychology";
  if (access === "paid") return "paid_psychology";
  if (category === "weapon") return "business";
  if (category === "shield" || category === "protocol") return "paid_psychology";
  return "other";
}

const STACK_ACCESS_SUFFIX = /\((FREE|PAID|UNLOCK)\)\s*$/i;

/** Parse trailing (FREE), (PAID), or (UNLOCK) from stack bullet lines. */
export function parseStackCourseAccess(courseLine: string): "free" | "paid" | null {
  const trimmed = courseLine.trim();
  const match = trimmed.match(STACK_ACCESS_SUFFIX);
  if (!match) return null;
  return match[1].toUpperCase() === "FREE" ? "free" : "paid";
}

export function parseStackCourseTitle(courseLine: string): string {
  return courseLine.replace(/\s*\((FREE|PAID|UNLOCK)\)\s*$/i, "").trim();
}

/** Strip (PAID)/(UNLOCK) from stack lines; keep (FREE) only. */
export function normalizeExecutionStackLines(lines: string[]): string[] {
  return lines.map((line) => {
    if (!line.startsWith("• ")) return line;
    const raw = line.replace(/^•\s*/, "").trim();
    const title = parseStackCourseTitle(raw);
    const access = parseStackCourseAccess(raw);
    if (access === "free") {
      return `• ${title} (FREE)`;
    }
    return `• ${title}`;
  });
}
