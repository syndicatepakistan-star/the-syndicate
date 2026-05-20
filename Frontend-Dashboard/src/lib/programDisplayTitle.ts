/** Display titles without leading "Crypto" (public + dashboard program UI). */
export function formatProgramDisplayTitle(title: string): string {
  if (!title?.trim()) return title;
  return title
    .replace(/\bcrypto\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
