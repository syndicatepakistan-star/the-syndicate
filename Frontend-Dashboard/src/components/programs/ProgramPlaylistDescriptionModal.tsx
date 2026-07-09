"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { enrichProgramPlaylist } from "@/lib/programPlaylistCatalog";
import { stripLessonPrefix } from "@/lib/descriptionText";
import { StructuredDescriptionBody } from "@/components/programs/StructuredDescriptionBody";
import { parseStructuredDescriptionSections } from "@/lib/structuredDescription";
import type { StreamPlaylistDescriptionSections, StreamPlaylistListItem } from "@/lib/streaming-api";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

export const PROGRAM_DETAIL_TRIGGER_ATTR = "data-program-playlist-detail";

type Props = {
  playlist: StreamPlaylistListItem | null;
  onClose: () => void;
};

function isTopLevelSectionHeading(line: string): boolean {
  const t = line.trim().toLowerCase();
  return (
    t === "introduction" ||
    t === "programme introduction" ||
    t === "programme description" ||
    t === "the hook" ||
    t === "what you will learn"
  );
}

function isHiddenSectionHeading(line: string): boolean {
  const t = line.trim().toLowerCase();
  return t === "the core protocol";
}

function displaySectionHeading(line: string): string {
  const t = line.trim().toLowerCase();
  if (t === "the hook" || t === "introduction" || t === "programme introduction") {
    return "Programme Introduction";
  }
  if (t === "the core protocol" || t === "programme description") return "Programme Description";
  if (t === "what you will learn") return "What you will learn";
  return line.trim();
}

function isLessonListLine(line: string): boolean {
  return /^\s*(?:Lesson|Module|Chapter)\s+\d+(?:\.\d+)?\s*:/i.test(line) || /^\s*Final\s+Lecture\s*:/i.test(line);
}

function isAllCapsHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 96) return false;
  if (t.split(/\s+/).filter(Boolean).length > 14) return false;
  return /^[A-Z0-9\s\-'",.\[\]:/&!?]+$/.test(t);
}

function isBracketHeadingLine(line: string): boolean {
  return /^\s*\[[^\]]+\]\s*$/.test(line);
}

function colonHeadingInner(line: string): string | null {
  const t = line.trim();
  if (!t.endsWith(":") || t.length < 3 || t.length > 72) return null;
  const inner = t.slice(0, -1).trim();
  if (inner.length < 2) return null;
  if (!/^[A-Z]/.test(inner)) return null;
  return inner;
}

/** "Introduction", "What You Will Learn", … (not ending in .) */
function isLikelyTitleCaseHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 72) return false;
  if (t.endsWith(".") || t.endsWith("?") || t.endsWith("!")) return false;
  if (/\d{3,}/.test(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 10) return false;
  const small = new Set([
    "and",
    "or",
    "the",
    "of",
    "for",
    "a",
    "an",
    "to",
    "in",
    "on",
    "at",
    "by",
    "as",
    "is",
    "it",
    "we",
    "you",
    "your",
    "with",
    "from",
    "into",
    "that",
    "this",
    "will",
    "our",
    "are",
    "be",
  ]);
  for (const w of words) {
    if (small.has(w.toLowerCase())) continue;
    if (/^[A-Z][a-zA-Z0-9'-]*$/.test(w)) continue;
    if (/^[A-Z]{2,4}$/.test(w)) continue;
    return false;
  }
  return true;
}

/** "The Publishing Fortress: Architecting…" → heading + body */
function splitInlineHeadingBody(line: string): { head: string; body: string } | null {
  const t = line.trim();
  const idx = t.indexOf(":");
  if (idx < 6 || idx > 52) return null;
  const head = t.slice(0, idx).trim();
  const body = t.slice(idx + 1).trim();
  if (!body || body.length < 20) return null;
  if (!/^[A-Z]/.test(head)) return null;
  if (head.split(/\s+/).length > 12) return null;
  return { head, body };
}

/** Few newlines: break common course sections and list intros */
function preprocessDenseDescription(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").trim();
  const newlineCount = (t.match(/\n/g) || []).length;
  if (newlineCount >= 5) return t;

  const inject: [RegExp, string][] = [
    [/\s+(The Publishing Fortress:\s*)/gi, "\n\n$1\n\n"],
    [/\s+(Programme Introduction)\s+/gi, "\n\n$1\n\n"],
    [/\s+(Programme Description)\s+/gi, "\n\n$1\n\n"],
    [/\s+(Introduction)\s+/gi, "\n\nProgramme Introduction\n\n"],
    [/\s+(The Hook)\s+/gi, "\n\nProgramme Introduction\n\n"],
    [/\s+(The Core Protocol)\s+/gi, "\n\nProgramme Description\n\n"],
    [/\s+(What You Will Learn)\s+/gi, "\n\n$1\n\n"],
  ];
  for (const [re, rep] of inject) {
    t = t.replace(re, rep);
  }
  t = t.replace(/(What You Will Learn)\s+(Intro,)/gi, "$1\n\n$2");
  return t;
}

function tryCommaTopicList(text: string, keyBase: number): ReactNode | null {
  const t = text.trim();
  if (!t.includes(",")) return null;
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) return null;
  if (parts.some((p) => p.length > 85)) return null;
  const avg = t.length / parts.length;
  if (avg > 52) return null;
  if (parts.some((p) => /\b(?:however|therefore|because|although|which|that)\b/i.test(p) && p.length > 40)) return null;
  return (
    <ul
      key={`ul-comma-${keyBase}`}
      className="my-1 list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-white/90 marker:text-[#e8c547] sm:text-[16px]"
    >
      {parts.map((p, i) => (
        <li key={i} className="pl-1">
          {p}
        </li>
      ))}
    </ul>
  );
}

function tryShortLinesAsList(text: string, keyBase: number): ReactNode | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 4) return null;
  if (!lines.every((l) => l.length >= 2 && l.length <= 72)) return null;
  if (lines.some((l) => /\.\s/.test(l))) return null;
  if (lines.some((l) => /\b(?:the|and|but|you are|it is|we strip)\s+[a-z]{4,}\b/.test(l))) return null;
  return (
    <ul
      key={`ul-lines-${keyBase}`}
      className="my-1 list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-white/90 marker:text-[#e8c547] sm:text-[16px]"
    >
      {lines.map((l, i) => (
        <li key={i} className="pl-1">
          {l}
        </li>
      ))}
    </ul>
  );
}

function parseDescriptionToBlocks(text: string): ReactNode {
  const normalized = preprocessDenseDescription(text);
  const lines = normalized.split("\n");
  const out: ReactNode[] = [];
  let para: string[] = [];
  let bulletBuf: string[] = [];
  let inLearnSection = false;
  let skipSection = false;
  let k = 0;

  const listClass =
    "my-1 list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-white/90 marker:text-white/35 sm:text-[16px]";

  const flushBulletList = () => {
    if (bulletBuf.length === 0) return;
    out.push(
      <ul key={`ul-${k++}`} className={listClass}>
        {bulletBuf.map((item, i) => (
          <li key={i} className="pl-1">
            {item}
          </li>
        ))}
      </ul>,
    );
    bulletBuf = [];
  };

  const pushLearnLine = (rawLine: string) => {
    const cleaned = stripLessonPrefix(rawLine);
    if (cleaned) bulletBuf.push(cleaned);
  };

  const flushPara = () => {
    if (para.length === 0) return;
    const content = para.join("\n").trimEnd();
    para = [];
    if (!content) return;

    if (inLearnSection) {
      for (const row of content.split("\n")) {
        const trimmed = row.trim();
        if (trimmed) pushLearnLine(trimmed);
      }
      flushBulletList();
      return;
    }

    const commaList = tryCommaTopicList(content, k);
    if (commaList) {
      out.push(commaList);
      k++;
      return;
    }
    const lineList = tryShortLinesAsList(content, k);
    if (lineList) {
      out.push(lineList);
      k++;
      return;
    }

    out.push(
      <p
        key={`p-${k++}`}
        className="text-[15px] font-normal leading-[1.85] tracking-normal text-white/90 antialiased sm:text-[16px] sm:leading-[1.9]"
      >
        {content}
      </p>,
    );
  };

  const pushSectionHeading = (title: string) => {
    out.push(
      <h3
        key={`h-${k++}`}
        className="text-[1.125rem] font-bold leading-snug text-[#f5c814] sm:text-[1.35rem]"
      >
        {title}
      </h3>,
    );
  };

  const mdHeading = /^\s*(#{1,3})\s+(.+)$/;
  const bulletLine = /^\s*[-*•·]\s+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (isHiddenSectionHeading(trimmed)) {
      flushPara();
      flushBulletList();
      inLearnSection = false;
      skipSection = true;
      continue;
    }
    if (isTopLevelSectionHeading(trimmed)) {
      flushPara();
      flushBulletList();
      skipSection = false;
      inLearnSection = trimmed.toLowerCase() === "what you will learn";
      pushSectionHeading(displaySectionHeading(trimmed));
      continue;
    }
    if (skipSection) continue;

    if (inLearnSection) {
      if (!trimmed) {
        flushBulletList();
        continue;
      }
      if (bulletLine.test(line)) {
        const bulletM = line.match(bulletLine);
        if (bulletM) pushLearnLine(bulletM[1]);
        continue;
      }
      if (isLessonListLine(line)) {
        pushLearnLine(trimmed);
        continue;
      }
      pushLearnLine(trimmed);
      continue;
    }

    const bulletM = line.match(bulletLine);
    if (bulletM) {
      flushPara();
      bulletBuf.push(stripLessonPrefix(bulletM[1]));
      continue;
    }
    if (bulletBuf.length && trimmed !== "") {
      flushBulletList();
    }

    const md = line.match(mdHeading);
    if (md) {
      flushPara();
      flushBulletList();
      pushSectionHeading(md[2].trim());
      continue;
    }
    if (trimmed === "") {
      flushPara();
      flushBulletList();
      continue;
    }

    const hb = splitInlineHeadingBody(line);
    if (hb && !inLearnSection) {
      flushPara();
      flushBulletList();
      para.push(`${hb.head}: ${hb.body}`);
      flushPara();
      continue;
    }

    if (isBracketHeadingLine(line)) {
      flushPara();
      flushBulletList();
      para.push(trimmed);
      continue;
    }
    const colonInner = colonHeadingInner(line);
    if (colonInner) {
      flushPara();
      flushBulletList();
      para.push(trimmed);
      continue;
    }
    if (isAllCapsHeadingLine(line)) {
      flushPara();
      flushBulletList();
      para.push(trimmed);
      continue;
    }
    if (isLikelyTitleCaseHeading(line)) {
      flushPara();
      flushBulletList();
      para.push(trimmed);
      continue;
    }
    para.push(line);
  }
  flushPara();
  flushBulletList();
  return (
    <div className="flex flex-col gap-5 sm:gap-6" role="document">
      {out}
    </div>
  );
}

function parseBodyStructuredSections(body: string): StreamPlaylistDescriptionSections | null {
  const parsed = parseStructuredDescriptionSections(body);
  if (!parsed) return null;
  return {
    hook: parsed.hook,
    core_protocol: parsed.core_protocol,
    what_you_will_learn: parsed.what_you_will_learn,
  };
}

const STRUCTURED_HEADINGS: { key: keyof StreamPlaylistDescriptionSections; label: string }[] = [
  { key: "hook", label: "Programme Introduction" },
  { key: "core_protocol", label: "Programme Description" },
  { key: "what_you_will_learn", label: "What you will learn" },
];

function pickStructuredSections(playlist: StreamPlaylistListItem): StreamPlaylistDescriptionSections | null {
  const s = playlist.description_sections;
  if (!s) return null;
  const hook = (s.hook ?? "").trim();
  const core = (s.core_protocol ?? "").trim();
  const learn = (s.what_you_will_learn ?? "").trim();
  if (!hook && !core && !learn) return null;
  return { hook, core_protocol: core, what_you_will_learn: learn };
}

/** "Module 12" / "chapter 3: Title" on their own line → subheading; other lines → bullets under current block. */
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
    if (cur.subheading || cur.items.length > 0) {
      blocks.push(cur);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(MODULE_OR_CHAPTER_LINE);
    if (m) {
      flush();
      const tail = (m[2] ?? "").trim();
      const subheading = tail ? stripLessonPrefix(tail) : null;
      cur = { subheading, items: [] };
    } else {
      const item = stripLessonPrefix(trimmed.replace(/^\s*[-*•·]\s+/, "").trim());
      if (item) cur.items.push(item);
    }
  }
  flush();

  if (blocks.length > 0) return blocks;

  /** No module/chapter lines: one block — comma-split or single paragraph as flat list. */
  const flat = t
    .split("\n")
    .map((l) => stripLessonPrefix(l.replace(/^\s*[-*•·]\s+/, "").trim()))
    .filter(Boolean);
  if (flat.length > 1) return [{ subheading: null, items: flat }];
  const one = flat[0] ?? t;
  if (one.includes(",")) {
    const parts = one.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3 && parts.every((p) => p.length <= 120)) return [{ subheading: null, items: parts }];
  }
  return [{ subheading: null, items: [one] }];
}

function WhatYouWillLearnBody({ text }: { text: string }) {
  const blocks = parseWhatYouWillLearnBlocks(text);
  if (blocks.length === 0) return null;

  const listClass =
    "my-1 list-disc space-y-2.5 pl-5 text-left text-[15px] leading-relaxed text-white/95 marker:text-white/35 sm:text-[16px]";

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {blocks.map((block, bi) => {
        if (block.items.length === 0 && !block.subheading) return null;
        return (
          <div key={bi} className="min-w-0">
            {block.subheading ? (
              <p className="mb-2.5 text-left text-[15px] font-semibold leading-relaxed text-white/95 sm:text-[16px]">
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

function StructuredPlaylistDescription({ sections }: { sections: StreamPlaylistDescriptionSections }) {
  return (
    <div className="flex flex-col gap-8 sm:gap-10" role="document">
      {STRUCTURED_HEADINGS.map(({ key, label }) => {
        const text = sections[key].trim();
        if (!text) return null;
        const isLearn = key === "what_you_will_learn";
        return (
          <section key={key} className="scroll-mt-4">
            <h3 className="border-b border-[#f5c814]/25 pb-2 text-left text-[1.05rem] font-bold uppercase tracking-[0.12em] text-[#f5c814] sm:text-[1.15rem] sm:tracking-[0.14em]">
              {label}
            </h3>
            <div className="mt-4 text-left">{isLearn ? <WhatYouWillLearnBody text={text} /> : parseDescriptionToBlocks(text)}</div>
          </section>
        );
      })}
    </div>
  );
}

export function ProgramPlaylistDescriptionModal({ playlist, onClose }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useModalScrollLock(!!playlist);

  useEffect(() => {
    if (!playlist || typeof document === "undefined") return;
    const scrollY = window.scrollY;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      });
    };
  }, [playlist?.id]);

  const displayPlaylist = useMemo(
    () => (playlist ? enrichProgramPlaylist(playlist) : null),
    [playlist]
  );

  const body = (displayPlaylist?.description || "").trim();
  const structured = useMemo(() => {
    if (!displayPlaylist || !body) return null;
    return parseBodyStructuredSections(body) ?? pickStructuredSections(displayPlaylist);
  }, [displayPlaylist, body]);
  const blocks = useMemo(() => {
    if (structured) return null;
    return body ? parseDescriptionToBlocks(body) : null;
  }, [body, structured]);

  if (!displayPlaylist || typeof document === "undefined") return null;

  const tree = (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8 font-[family-name:var(--font-body)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="program-desc-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close description"
      />
      <div
        className={cn(
          "relative z-[1] flex max-h-[min(95dvh,960px)] w-full max-w-[min(96vw,80rem)] flex-col overflow-hidden rounded-2xl border-2 border-[#f5c814]/50",
          "bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(6,6,8,0.99))] shadow-[0_0_40px_rgba(245,200,20,0.25),0_24px_80px_rgba(0,0,0,0.85)]",
          "[&_h3]:scroll-mt-4 font-[family-name:var(--font-body)]",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-10 sm:py-6">
          <h2
            id="program-desc-modal-title"
            className="min-w-0 flex-1 text-left text-[1.125rem] font-bold leading-snug tracking-normal text-[#f5c814] sm:text-[1.35rem] sm:leading-tight"
          >
            {displayPlaylist.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/20 bg-black/50 p-2 text-white/80 transition hover:border-[#f5c814]/60 hover:text-[#f5c814]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="vault-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-10 sm:py-9 [scroll-behavior:auto] [-webkit-overflow-scrolling:touch] [&_strong]:font-semibold [&_strong]:text-white/95">
          {structured || body ? (
            <div className="w-full max-w-none pb-2">
              <StructuredDescriptionBody text={body} prominent />
            </div>
          ) : blocks ? (
            <div className="w-full max-w-none pb-2">{blocks}</div>
          ) : (
            <p className="text-[17px] leading-relaxed text-white/55 sm:text-[18px]">
              No description has been added for this program yet. In Django admin, use section lines{" "}
              <span className="font-semibold text-white/70">Programme Introduction</span>,{" "}
              <span className="font-semibold text-white/70">Programme Description</span>, and{" "}
              <span className="font-semibold text-white/70">What you will learn</span>, each on its own line, then the
              text for each section below.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(tree, document.body);
}
