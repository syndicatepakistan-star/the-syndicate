"use client";

import { useMemo } from "react";
import { stripLessonPrefix } from "@/lib/descriptionText";
import { cn } from "@/components/dashboard/dashboardPrimitives";

export type StructuredDescriptionSections = {
  hook: string;
  core_protocol: string;
  what_you_will_learn: string;
};

const STRUCTURED_HEADINGS: { key: keyof StructuredDescriptionSections; label: string }[] = [
  { key: "hook", label: "The Hook" },
  { key: "core_protocol", label: "The core protocol" },
  { key: "what_you_will_learn", label: "What you will learn" },
];

const MODULE_OR_CHAPTER_LINE =
  /^\s*(?:module|chapter)\s+(\d+)\s*(?:[:.)-]\s*)?(.*)$/i;

type LearnBlock = { subheading: string | null; items: string[] };

export function parseStructuredDescriptionSections(body: string): StructuredDescriptionSections | null {
  const t = body.replace(/\r\n/g, "\n").trim();
  if (!t) return null;
  const hookMatch = t.match(
    /(?:^|\n)\s*The Hook\s*\n+([\s\S]*?)(?=\n\s*The Core Protocol\s*\n)/i,
  );
  const coreMatch = t.match(
    /(?:^|\n)\s*The Core Protocol\s*\n+([\s\S]*?)(?=\n\s*What You Will Learn\s*\n)/i,
  );
  const learnMatch = t.match(/(?:^|\n)\s*What You Will Learn\s*\n+([\s\S]*)$/i);
  const hook = hookMatch?.[1]?.trim() ?? "";
  const core = coreMatch?.[1]?.trim() ?? "";
  const learn = learnMatch?.[1]?.trim() ?? "";
  if (!hook && !core && !learn) return null;
  return { hook, core_protocol: core, what_you_will_learn: learn };
}

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
  const hidden = new Set(omitSections);
  const headingClass = prominent
    ? "border-b border-[#f5c814]/25 pb-2.5 text-left text-[1.2rem] font-bold uppercase tracking-[0.12em] text-[#f5c814] sm:text-[1.35rem] sm:tracking-[0.14em] font-[family-name:var(--font-heading)]"
    : compact
      ? "border-b border-[#f5c814]/25 pb-1.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[#f5c814] sm:text-[12px]"
      : "border-b border-[#f5c814]/25 pb-2 text-left text-[1.05rem] font-bold uppercase tracking-[0.12em] text-[#f5c814] sm:text-[1.15rem] sm:tracking-[0.14em] font-[family-name:var(--font-heading)]";

  return (
    <div
      className={compact ? "flex flex-col gap-5 sm:gap-6" : "flex flex-col gap-8 sm:gap-10"}
      role="document"
    >
      {STRUCTURED_HEADINGS.map(({ key, label }) => {
        if (hidden.has(key)) return null;
        const text = sections[key].trim();
        if (!text) return null;
        const isLearn = key === "what_you_will_learn";
        return (
          <section key={key} className="scroll-mt-4">
            <h3 className={headingClass}>{label}</h3>
            <div className="mt-3 sm:mt-4">
              {isLearn ? (
                <WhatYouWillLearnBody text={text} prominent={prominent} />
              ) : (
                <ParagraphBody text={text} compact={compact} prominent={prominent} />
              )}
            </div>
          </section>
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
