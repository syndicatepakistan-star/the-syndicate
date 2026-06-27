/** Strip lesson/module numbering prefixes from description list lines (e.g. "Lesson 1.1: Title" → "Title"). */
export function stripLessonPrefix(line: string): string {
  let s = line.trim();
  s = s.replace(
    /^\s*(?:Lessons?|Modules?|Chapters?|Lectures?|Parts?)\s+\d+(?:\.\d+)+\s*[:.)\-–—]?\s*/i,
    "",
  );
  s = s.replace(/^\s*(?:Lessons?|Modules?|Chapters?|Lectures?|Parts?)\s+\d+\s*[:.)\-–—]?\s*/i, "");
  s = s.replace(/^\s*\d+(?:\.\d+)+\s*[:.)\-–—]\s*/i, "");
  s = s.replace(/^\s*Final\s+Lecture\s*:\s*/i, "");
  return s.trim();
}

const MODULE_OR_CHAPTER_LINE =
  /^\s*(?:module|chapter)\s+(\d+)\s*(?:[:.)-]\s*)?(.*)$/i;

function cleanLearnSectionBody(body: string): string {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      const m = trimmed.match(MODULE_OR_CHAPTER_LINE);
      if (m) {
        const tail = (m[2] ?? "").trim();
        return tail ? stripLessonPrefix(tail) : "";
      }
      const bullet = trimmed.replace(/^\s*[-*•·]\s+/, "").trim();
      return stripLessonPrefix(bullet);
    })
    .filter(Boolean)
    .join("\n");
}

/** Remove lesson numbering from the "What You Will Learn" block (and inline lesson lines elsewhere). */
export function cleanProgramDescription(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return normalized;

  const learnMatch = normalized.match(
    /^([\s\S]*?\n\s*What You Will Learn\s*\n+)([\s\S]*)$/i,
  );
  if (learnMatch) {
    const head = learnMatch[1] ?? "";
    const learnBody = learnMatch[2] ?? "";
    return `${head}${cleanLearnSectionBody(learnBody)}`.trim();
  }

  return normalized
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (/^\s*(?:Lessons?|Modules?|Chapters?)\s+\d/i.test(trimmed) || /^\s*\d+\.\d+\s*:/.test(trimmed)) {
        return stripLessonPrefix(trimmed.replace(/^\s*[-*•·]\s+/, ""));
      }
      return line;
    })
    .join("\n");
}
