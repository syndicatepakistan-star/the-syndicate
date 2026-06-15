import catalogEntries from "@/data/stream-playlist-catalog.json";
import { programPlaylistDeepLink } from "@/lib/programPlaylistThumbnails";

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
  "business warfare": "The Art of Mastering Human Behavior in Business",
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
  const programId = resolveQuizCatalogCourseProgramId(courseName);
  if (!programId) return undefined;
  return programPlaylistDeepLink(programId);
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
