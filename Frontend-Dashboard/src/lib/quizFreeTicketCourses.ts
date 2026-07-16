/** Psychology programs eligible for quiz free-ticket unlock (matches backend catalog). */
export const FREE_TICKET_PSYCHOLOGY_COURSES = [
  "Zero to 1 Million",
  "9 to 5 Exit Strategy",
] as const;

/** Catalog title (lowercase) → stream playlist id (API + catalog). */
const FREE_TICKET_PROGRAM_IDS: Record<string, number> = {
  "zero to 1 million": 2,
  "zero to one million": 2,
  "9 to 5 exit strategy": 1,
  "the 9 to 5 exit strategy": 1,
};

function normalizeFreeTicketKey(courseName: string): string | null {
  const key = courseName.trim().toLowerCase();
  if (key in FREE_TICKET_PROGRAM_IDS) return key;
  return null;
}

export function resolveFreeTicketProgramId(courseName: string): number | undefined {
  const key = normalizeFreeTicketKey(courseName);
  if (!key) return undefined;
  return FREE_TICKET_PROGRAM_IDS[key];
}

export function isFreeTicketPsychologyCourse(courseName: string): boolean {
  return normalizeFreeTicketKey(courseName) !== null;
}

/** Private dashboard programs library — highlight unlocked free-ticket card. */
export function freeTicketDashboardPath(courseName: string): string {
  const programId = resolveFreeTicketProgramId(courseName);
  if (!programId) return "/dashboard/programs";
  return `/dashboard/programs?program=${programId}`;
}

export function freeTicketLoginNextPath(courseName: string): string {
  return freeTicketDashboardPath(courseName);
}

export function buildFreeTicketLoginHref(email: string, courseName: string): string {
  const next = freeTicketDashboardPath(courseName);
  const params = new URLSearchParams();
  if (email.trim()) params.set("email", email.trim());
  params.set("ticket", courseName.trim());
  params.set("next", next);
  return `/login?${params.toString()}`;
}
