const SECTION_D_CTA_OLD = "Claim your plan now or stay stuck where you are.";
const SECTION_D_CTA_NEW =
  "Unlock the Syndicate secret techniques now or stay stuck where you are.";

/** Uppercase the title segment; leave parenthetical clauses unchanged. */
export function capitalizeHeadingOutsideBrackets(text: string): string {
  const trimmed = text.trim();
  const parenIndex = trimmed.indexOf("(");
  if (parenIndex === -1) {
    return trimmed.toUpperCase();
  }
  const main = trimmed.slice(0, parenIndex).trim();
  const paren = trimmed.slice(parenIndex).trim();
  return `${main.toUpperCase()} ${paren}`.trim();
}

/** Section card titles on the quiz result page. */
export function formatQuizSectionTitle(title: string): string {
  const trimmed = title.trim();
  if (/^Section C:/i.test(trimmed)) {
    return "Section C: THE SYNDICATE DIAGNOSIS";
  }
  const match = trimmed.match(/^(Section\s+[A-Z]:\s*)(.+)$/i);
  if (!match) return trimmed;
  return `${match[1]}${capitalizeHeadingOutsideBrackets(match[2])}`;
}

export function normalizeQuizReportLine(line: string): string {
  if (line.includes(SECTION_D_CTA_OLD)) {
    return line.replace(SECTION_D_CTA_OLD, SECTION_D_CTA_NEW);
  }
  return line;
}

export function normalizeQuizReportLines(lines: string[]): string[] {
  return lines.map((line) => {
    if (line.startsWith("Section ")) {
      return formatQuizSectionTitle(line);
    }
    return normalizeQuizReportLine(line);
  });
}
