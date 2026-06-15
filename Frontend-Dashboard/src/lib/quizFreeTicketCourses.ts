/** Psychology programs eligible for quiz free-ticket unlock (matches backend catalog). */
export const FREE_TICKET_PSYCHOLOGY_COURSES = [
  "Zero to 1 Million",
  "9 to 5 Exit Strategy",
] as const;

/** Catalog title (lowercase) → public programs page playlist id. */
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

export function isFreeTicketPsychologyCourse(courseName: string): boolean {
  return normalizeFreeTicketKey(courseName) !== null;
}

export function freeTicketLoginNextPath(courseName: string): string {
  const key = normalizeFreeTicketKey(courseName);
  const programId = key ? FREE_TICKET_PROGRAM_IDS[key] : undefined;
  if (!programId) return "/programs#programs-library";
  return `/programs?program=${programId}#programs-library`;
}

export function buildFreeTicketLoginHref(email: string, courseName: string): string {
  const next = freeTicketLoginNextPath(courseName);
  const params = new URLSearchParams();
  if (email.trim()) params.set("email", email.trim());
  params.set("ticket", courseName.trim());
  params.set("next", next);
  return `/login?${params.toString()}`;
}
