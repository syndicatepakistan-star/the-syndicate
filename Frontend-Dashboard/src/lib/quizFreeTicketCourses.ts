/** Psychology programs eligible for quiz free-ticket unlock (matches backend catalog). */
export const FREE_TICKET_PSYCHOLOGY_COURSES = [
  "Secret To Transformation",
  "The Micro Business Protocol",
  "Zero to 1 Million",
  "Mastering Risk and Uncertainty",
] as const;

/** Catalog title (lowercase) → public programs page playlist id. */
const FREE_TICKET_PROGRAM_IDS: Record<string, number> = {
  "secret to transformation": 9,
  "the micro business protocol": 30,
  "zero to 1 million": 2,
  "mastering risk and uncertainty": 31,
};

export function isFreeTicketPsychologyCourse(courseName: string): boolean {
  const key = courseName.trim().toLowerCase();
  return key in FREE_TICKET_PROGRAM_IDS;
}

export function freeTicketLoginNextPath(courseName: string): string {
  const programId = FREE_TICKET_PROGRAM_IDS[courseName.trim().toLowerCase()];
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
