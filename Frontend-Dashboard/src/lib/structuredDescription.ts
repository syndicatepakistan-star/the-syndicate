/** Shared structured program description parsing and formatting. */

export type StructuredDescriptionSections = {
  /** Programme Introduction paragraph(s). */
  hook: string;
  /** Programme Description paragraph(s). */
  core_protocol: string;
  projects_you_will_build: string;
  what_you_will_learn: string;
};

const PROGRAMME_INTRO_HEADING_RE = /(?:^|\n)\s*(?:Programme Introduction|Introduction|The Hook)\s*\n/i;
const PROGRAMME_DESC_HEADING_RE = /(?:^|\n)\s*(?:Programme Description|The Core Protocol)\s*\n/i;
const PROJECTS_HEADING_RE = /(?:^|\n)\s*Projects You Will Build\s*\n/i;
const LEARN_HEADING_RE = /(?:^|\n)\s*What You Will Learn\s*\n/i;

function splitLegacyIntroductionBlock(text: string): { intro: string; description: string } {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { intro: parts[0] ?? "", description: parts.slice(1).join("\n\n") };
  }
  return { intro: text.trim(), description: "" };
}

export function parseStructuredDescriptionSections(body: string): StructuredDescriptionSections | null {
  const t = body.replace(/\r\n/g, "\n").trim();
  if (!t) return null;

  const nextHeading =
    "Programme Introduction|Introduction|The Hook|Programme Description|The Core Protocol|Projects You Will Build|What You Will Learn";

  const introMatch = t.match(
    new RegExp(
      `${PROGRAMME_INTRO_HEADING_RE.source}([\\s\\S]*?)(?=\\n\\s*(?:Programme Description|The Core Protocol|Projects You Will Build|What You Will Learn)\\s*\\n|$)`,
      "i",
    ),
  );
  const descMatch = t.match(
    new RegExp(
      `${PROGRAMME_DESC_HEADING_RE.source}([\\s\\S]*?)(?=\\n\\s*(?:Projects You Will Build|What You Will Learn|Programme Introduction|Introduction|The Hook)\\s*\\n|$)`,
      "i",
    ),
  );
  const projectsMatch = t.match(
    new RegExp(
      `${PROJECTS_HEADING_RE.source}([\\s\\S]*?)(?=\\n\\s*(?:What You Will Learn|Programme Introduction|Introduction|The Hook|Programme Description|The Core Protocol)\\s*\\n|$)`,
      "i",
    ),
  );
  const learnMatch = t.match(
    new RegExp(
      `${LEARN_HEADING_RE.source}([\\s\\S]*?)(?=\\n\\s*(?:${nextHeading})\\s*\\n|$)`,
      "i",
    ),
  );

  let hook = introMatch?.[1]?.trim() ?? "";
  let core = descMatch?.[1]?.trim() ?? "";
  const projects = projectsMatch?.[1]?.trim() ?? "";
  const learn = learnMatch?.[1]?.trim() ?? "";

  if (!core && hook && !descMatch) {
    const split = splitLegacyIntroductionBlock(hook);
    hook = split.intro;
    core = split.description;
  }

  if (!hook && !core && !projects && !learn) return null;
  return {
    hook,
    core_protocol: core,
    projects_you_will_build: projects,
    what_you_will_learn: learn,
  };
}

/** First paragraph of Programme Introduction — used for card teasers and summaries. */
export function extractProgrammeIntroductionTeaser(description: string): string {
  const sections = parseStructuredDescriptionSections(description);
  if (sections?.hook) {
    const first = sections.hook.split(/\n\s*\n/)[0]?.replace(/\s+/g, " ").trim();
    if (first) return first;
  }

  const match = description.match(
    /(?:Programme Introduction|Introduction|The Hook)\s*\n([\s\S]*?)(?:\n\n(?:Programme Description|The Core Protocol|What You Will Learn)|\n(?:Programme Description|The Core Protocol|What You Will Learn))/i,
  );
  const hook = match?.[1]?.trim() ?? "";
  const first = hook.split(/\n\s*\n/)[0]?.replace(/\s+/g, " ").trim();
  return first || hook.replace(/\s+/g, " ").trim();
}

export function formatStructuredDescription(
  programmeIntroduction: string,
  programmeDescription: string,
  learnItems: string[],
  projectsYouWillBuild = "",
): string {
  const intro = programmeIntroduction.trim();
  const desc = programmeDescription.trim();
  const projects = projectsYouWillBuild.trim();
  const learn = learnItems.map((item) => item.trim()).filter(Boolean).join("\n");

  const parts: string[] = [];
  if (projects) parts.push(`Projects You Will Build\n${projects}`);
  if (intro) parts.push(`Programme Introduction\n${intro}`);
  if (desc) parts.push(`Programme Description\n${desc}`);
  if (learn) parts.push(`What You Will Learn\n${learn}`);
  return parts.join("\n\n");
}
