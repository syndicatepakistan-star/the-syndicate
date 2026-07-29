"use client";

import { Fragment, useMemo } from "react";
import { stripLessonPrefix } from "@/lib/descriptionText";
import {
  parseStructuredDescriptionSections,
  type StructuredDescriptionSections,
} from "@/lib/structuredDescription";
import { cn } from "@/components/dashboard/dashboardPrimitives";

export type { StructuredDescriptionSections };

const STRUCTURED_HEADINGS: {
  key: keyof StructuredDescriptionSections;
  label: string;
  colorClass: string;
  color: string;
}[] = [
  { key: "projects_you_will_build", label: "Projects you will build", colorClass: "text-violet-300", color: "#c4b5fd" },
  { key: "hook", label: "Programme Introduction", colorClass: "text-[#f5c814]", color: "#f5c814" },
  { key: "core_protocol", label: "Programme Description", colorClass: "text-cyan-300", color: "#67e8f9" },
  { key: "what_you_will_learn", label: "What you will learn", colorClass: "text-emerald-300", color: "#6ee7b7" },
];

type ExactTradingSectionKey = "chart_patterns" | "setups" | "strategy";

const EXACT_TRADING_SECTIONS: {
  key: ExactTradingSectionKey;
  label: string;
  colorClass: string;
  color: string;
}[] = [
  { key: "chart_patterns", label: "Exact Chart Patterns", colorClass: "text-blue-400", color: "#60a5fa" },
  { key: "setups", label: "Exact Setups", colorClass: "text-rose-400", color: "#fb7185" },
  { key: "strategy", label: "Exact Strategy", colorClass: "text-orange-300", color: "#fdba74" },
];

function exactTradingSectionKey(line: string): ExactTradingSectionKey | null {
  const normalized = line.trim().toLowerCase();
  if (normalized === "exact chart pattern" || normalized === "exact chart patterns") {
    return "chart_patterns";
  }
  if (normalized === "exact setup" || normalized === "exact setups") return "setups";
  if (normalized === "exact strategy" || normalized === "exact strategies") return "strategy";
  return null;
}

/** Pull trading detail groups out of What You Will Learn so they can be displayed as real sections. */
function splitExactTradingSections(raw: string): {
  whatYouWillLearn: string;
  exact: Record<ExactTradingSectionKey, string>;
} {
  const remaining: string[] = [];
  const buckets: Record<ExactTradingSectionKey, string[]> = {
    chart_patterns: [],
    setups: [],
    strategy: [],
  };
  let active: ExactTradingSectionKey | null = null;

  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    const heading = exactTradingSectionKey(line);
    if (heading) {
      active = heading;
      continue;
    }
    if (active) buckets[active].push(line);
    else remaining.push(line);
  }

  return {
    whatYouWillLearn: remaining.join("\n").trim(),
    exact: {
      chart_patterns: buckets.chart_patterns.join("\n").trim(),
      setups: buckets.setups.join("\n").trim(),
      strategy: buckets.strategy.join("\n").trim(),
    },
  };
}

export { parseStructuredDescriptionSections };

const MODULE_OR_CHAPTER_LINE =
  /^\s*(?:module|chapter)\s+(\d+)\s*(?:[:.)-]\s*)?(.*)$/i;

type LearnBlock = { subheading: string | null; items: string[] };

function parseWhatYouWillLearnBlocks(raw: string): LearnBlock[] {
  const t = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!t) return [];

  const lines = t.split("\n");
  const blocks: LearnBlock[] = [];
  let cur: LearnBlock = { subheading: null, items: [] };

  const flush = () => {
    if (cur.subheading || cur.items.length > 0) blocks.push(cur);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(MODULE_OR_CHAPTER_LINE);
    if (m) {
      flush();
      const tail = (m[2] ?? "").trim();
      cur = { subheading: tail ? stripLessonPrefix(tail) : null, items: [] };
    } else {
      const item = stripLessonPrefix(trimmed.replace(/^\s*[-*•·]\s+/, "").trim());
      if (item) cur.items.push(item);
    }
  }
  flush();

  if (blocks.length > 0) return blocks;

  const flat = t
    .split("\n")
    .map((l) => stripLessonPrefix(l.replace(/^\s*[-*•·]\s+/, "").trim()))
    .filter(Boolean);
  if (flat.length > 1) return [{ subheading: null, items: flat }];
  const one = flat[0] ?? t;
  if (one.includes(",")) {
    const parts = one.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3 && parts.every((p) => p.length <= 120)) {
      return [{ subheading: null, items: parts }];
    }
  }
  return [{ subheading: null, items: [one] }];
}

function WhatYouWillLearnBody({ text, prominent }: { text: string; prominent?: boolean }) {
  const blocks = parseWhatYouWillLearnBlocks(text);
  if (blocks.length === 0) return null;

  const listClass = prominent
    ? "my-1 list-disc space-y-3 pl-5 text-left text-[17px] leading-relaxed text-white/95 marker:text-white/35 sm:text-[18px] font-[family-name:var(--font-body)]"
    : "my-1 list-disc space-y-2.5 pl-5 text-left text-[15px] leading-relaxed text-white/95 marker:text-white/35 sm:text-[16px] font-[family-name:var(--font-body)]";

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {blocks.map((block, bi) => {
        if (block.items.length === 0 && !block.subheading) return null;
        return (
          <div key={bi} className="min-w-0">
            {block.subheading ? (
              <p
                className={cn(
                  "mb-2.5 text-left font-semibold leading-relaxed text-white/95 font-[family-name:var(--font-body)]",
                  prominent ? "text-[17px] sm:text-[18px]" : "text-[15px] sm:text-[16px]",
                )}
              >
                {stripLessonPrefix(block.subheading)}
              </p>
            ) : null}
            {block.items.length > 0 ? (
              <ul className={listClass}>
                {block.items.map((item, ii) => (
                  <li key={ii} className="pl-1">
                    {stripLessonPrefix(item)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Rotating neon colors for each project title in pack / program details. */
const PROJECT_TITLE_NEONS = [
  "#67e8f9", // cyan
  "#f5c814", // gold
  "#f0abfc", // fuchsia
  "#6ee7b7", // emerald
  "#c4b5fd", // violet
  "#fb7185", // rose
  "#fdba74", // orange
  "#93c5fd", // sky
  "#f9a8d4", // pink
  "#a3e635", // lime
  "#22d3ee", // bright cyan
  "#e879f9", // bright fuchsia
] as const;

type ProjectItem = { title: string; description: string };

function splitProjectTitleDescription(raw: string): ProjectItem {
  const cleaned = stripLessonPrefix(raw.replace(/^\s*[-*•·\d.)]+\s*/, "").trim());
  const withoutBold = cleaned.replace(/^\*\*(.+?)\*\*\s*:?\s*/u, "$1: ").replace(/\*\*/g, "");
  const colonIdx = withoutBold.indexOf(":");
  if (colonIdx > 0 && colonIdx < 120) {
    return {
      title: withoutBold.slice(0, colonIdx).trim(),
      description: withoutBold.slice(colonIdx + 1).trim(),
    };
  }
  return { title: withoutBold, description: "" };
}

function isProjectGroupHeading(line: string): boolean {
  const t = line.trim().replace(/^\*\*(.+)\*\*$/u, "$1").trim();
  if (!t) return false;
  if (/^(?:module|chapter)\s+\d+/i.test(t)) return true;
  if (/^beginner/i.test(t) || /^advanced/i.test(t) || /^intermediate/i.test(t)) return true;
  if (/projects?$/i.test(t) && t.length < 80 && !t.includes(":")) return true;
  return false;
}

/** Detect "Project Title: description" lines (with or without bullets). */
function isProjectEntryLine(line: string): boolean {
  if (isProjectGroupHeading(line)) return false;
  if (/^\s*[-*•·]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) return true;
  const cleaned = stripLessonPrefix(line.replace(/^\s*[-*•·\d.)]+\s*/, "").trim());
  const withoutBold = cleaned.replace(/^\*\*(.+?)\*\*\s*:?\s*/u, "$1: ").replace(/\*\*/g, "");
  const colonIdx = withoutBold.indexOf(":");
  if (colonIdx <= 0 || colonIdx > 110) return false;
  const title = withoutBold.slice(0, colonIdx).trim();
  if (!title || title.split(/\s+/).length > 14) return false;
  // Require some description after the colon so prose paragraphs aren't treated as projects.
  return withoutBold.slice(colonIdx + 1).trim().length > 0;
}

type ProjectBlock = { intro: string[]; heading: string | null; items: ProjectItem[] };

function parseProjectsYouWillBuild(raw: string): ProjectBlock[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const blocks: ProjectBlock[] = [];
  let intro: string[] = [];
  let heading: string | null = null;
  let items: ProjectItem[] = [];
  let startedItems = false;

  const flush = () => {
    if (intro.length || heading || items.length) {
      blocks.push({ intro, heading, items });
    }
    intro = [];
    heading = null;
    items = [];
  };

  for (const line of lines) {
    if (isProjectGroupHeading(line)) {
      // Keep intro with the first group; only flush when a prior group already has content.
      if (items.length > 0 || heading) flush();
      heading = stripLessonPrefix(line.replace(/^\*\*(.+)\*\*$/u, "$1").trim());
      startedItems = false;
      continue;
    }
    if (isProjectEntryLine(line)) {
      startedItems = true;
      items.push(splitProjectTitleDescription(line));
      continue;
    }
    if (!startedItems && items.length === 0) {
      intro.push(line.replace(/^\*\*(.+)\*\*$/u, "$1").trim());
      continue;
    }
    // Continuation line for previous project description
    if (items.length > 0) {
      const last = items[items.length - 1]!;
      last.description = `${last.description} ${line}`.trim();
    } else {
      intro.push(line);
    }
  }
  flush();

  if (blocks.length === 0) {
    return [{ intro: [], heading: null, items: lines.map(splitProjectTitleDescription) }];
  }
  return blocks;
}

export function ProjectsYouWillBuildBody({ text, prominent }: { text: string; prominent?: boolean }) {
  const blocks = parseProjectsYouWillBuild(text);
  if (blocks.length === 0) return null;

  const bodyClass = prominent
    ? "text-[17px] leading-relaxed text-white/95 sm:text-[18px] font-[family-name:var(--font-body)]"
    : "text-[15px] leading-relaxed text-white/95 sm:text-[16px] font-[family-name:var(--font-body)]";
  // Titles +4pt larger than body copy for clear scan hierarchy.
  const titleClass = prominent
    ? "text-[calc(17px+4pt)] font-bold leading-snug sm:text-[calc(18px+4pt)] font-[family-name:var(--font-heading)]"
    : "text-[calc(15px+4pt)] font-bold leading-snug sm:text-[calc(16px+4pt)] font-[family-name:var(--font-heading)]";
  const numberClass = prominent
    ? "text-[calc(17px+4pt)] font-black tabular-nums sm:text-[calc(18px+4pt)]"
    : "text-[calc(15px+4pt)] font-black tabular-nums sm:text-[calc(16px+4pt)]";

  let projectIndex = 0;

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {blocks.map((block, bi) => (
        <div key={bi} className="min-w-0">
          {block.intro.length > 0 ? (
            <div className="mb-4 flex flex-col gap-3 sm:mb-5">
              {block.intro.map((p, i) => (
                <p key={i} className={cn("text-left", bodyClass)}>
                  {p}
                </p>
              ))}
            </div>
          ) : null}
          {block.heading ? (
            <p
              className={cn(
                "mb-3 text-left font-semibold text-white/95 font-[family-name:var(--font-body)]",
                prominent ? "text-[17px] sm:text-[18px]" : "text-[15px] sm:text-[16px]",
              )}
            >
              {block.heading}
            </p>
          ) : null}
          {block.items.length > 0 ? (
            <ol className="m-0 list-none space-y-4 p-0 sm:space-y-5">
              {block.items.map((item, ii) => {
                const color = PROJECT_TITLE_NEONS[projectIndex % PROJECT_TITLE_NEONS.length]!;
                const n = projectIndex + 1;
                projectIndex += 1;
                return (
                  <li key={ii} className="flex gap-3 text-left sm:gap-3.5">
                    <span className={cn("shrink-0", numberClass)} style={{ color }} aria-hidden>
                      {n}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={titleClass} style={{ color, textShadow: `0 0 14px ${color}55` }}>
                        {item.title}
                      </p>
                      {item.description ? (
                        <p className={cn("mt-1.5", bodyClass)}>{item.description}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ParagraphBody({
  text,
  compact,
  prominent,
}: {
  text: string;
  compact?: boolean;
  prominent?: boolean;
}) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const bodyClass = prominent
    ? "text-left text-[17px] leading-[1.85] text-white/95 sm:text-[18px] sm:leading-[1.9] font-[family-name:var(--font-body)]"
    : compact
      ? "text-left text-[12px] leading-relaxed text-white/78 sm:text-[13px] font-[family-name:var(--font-body)]"
      : "text-left text-[15px] leading-[1.85] text-white/95 sm:text-[16px] sm:leading-[1.9] font-[family-name:var(--font-body)]";

  if (paragraphs.length === 0) {
    return <p className={bodyClass}>{text}</p>;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {paragraphs.map((p, i) => (
        <p key={i} className={bodyClass}>
          {p}
        </p>
      ))}
    </div>
  );
}

function StructuredSectionsView({
  sections,
  compact,
  prominent,
  omitSections = [],
}: {
  sections: StructuredDescriptionSections;
  compact?: boolean;
  prominent?: boolean;
  omitSections?: (keyof StructuredDescriptionSections)[];
}) {
  const hidden = new Set<keyof StructuredDescriptionSections>(omitSections);
  const headingClass = prominent
    ? "border-b border-current/30 pb-2.5 text-left text-[20pt] font-bold uppercase leading-snug tracking-[0.12em] sm:tracking-[0.14em] font-[family-name:var(--font-heading)]"
    : compact
      ? "border-b border-current/30 pb-1.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] sm:text-[12px]"
      : "border-b border-current/30 pb-2 text-left text-[20px] font-bold uppercase tracking-[0.12em] sm:text-[20pt] sm:tracking-[0.14em] font-[family-name:var(--font-heading)]";

  return (
    <div
      className={compact ? "flex flex-col gap-5 sm:gap-6" : "flex flex-col gap-8 sm:gap-10"}
      role="document"
    >
      {STRUCTURED_HEADINGS.map(({ key, label, colorClass, color }) => {
        const isLearn = key === "what_you_will_learn";
        if (hidden.has(key) && !isLearn) return null;
        const text = sections[key].trim();
        if (!text) return null;
        const isProjects = key === "projects_you_will_build";
        const tradingSections = isLearn ? splitExactTradingSections(text) : null;
        const sectionText = tradingSections?.whatYouWillLearn ?? text;
        return (
          <Fragment key={key}>
            {tradingSections
              ? EXACT_TRADING_SECTIONS.map((exactSection) => {
                  const exactText = tradingSections.exact[exactSection.key];
                  if (!exactText) return null;
                  return (
                    <section key={exactSection.key} className="scroll-mt-4">
                      <h3
                        className={cn(headingClass, exactSection.colorClass)}
                        style={{ color: exactSection.color }}
                      >
                        {exactSection.label}
                      </h3>
                      <div className="mt-3 sm:mt-4">
                        <WhatYouWillLearnBody text={exactText} prominent={prominent} />
                      </div>
                    </section>
                  );
                })
              : null}
            {!hidden.has(key) && sectionText ? (
              <section className="scroll-mt-4">
                <h3 className={cn(headingClass, colorClass)} style={{ color }}>
                  {label}
                </h3>
                <div className="mt-3 sm:mt-4">
                  {isProjects ? (
                    <ProjectsYouWillBuildBody text={sectionText} prominent={prominent} />
                  ) : isLearn ? (
                    <WhatYouWillLearnBody text={sectionText} prominent={prominent} />
                  ) : (
                    <ParagraphBody text={sectionText} compact={compact} prominent={prominent} />
                  )}
                </div>
              </section>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

type Props = {
  text: string;
  /** Tighter typography for small vault headers. */
  compact?: boolean;
  /** Large readable copy for program / vault modals. */
  prominent?: boolean;
  /** Hide structured sections already shown elsewhere (e.g. lesson lists). */
  omitSections?: (keyof StructuredDescriptionSections)[];
  className?: string;
};

export function StructuredDescriptionBody({
  text,
  compact,
  prominent,
  omitSections,
  className,
}: Props) {
  const sections = useMemo(() => parseStructuredDescriptionSections(text), [text]);
  if (!sections) {
    return (
      <div className={className}>
        <ParagraphBody text={text} compact={compact} prominent={prominent} />
      </div>
    );
  }
  return (
    <div className={className}>
      <StructuredSectionsView
        sections={sections}
        compact={compact}
        prominent={prominent}
        omitSections={omitSections}
      />
    </div>
  );
}
