"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import BrandHeader from "@/components/quiz-funnel/BrandHeader";
import { QuizResultProgramCard } from "@/components/quiz-funnel/QuizResultProgramCard";
import dynamic from "next/dynamic";
import {
  buildFreeTicketLoginHref,
  isFreeTicketPsychologyCourse,
} from "@/lib/quizFreeTicketCourses";
import {
  classifyArchetypeMapLine,
  classifyExecutionStackLine,
  executionStackCategoryToActionCategory,
  isArchetypeCourseMapSection,
  isExecutionStackSection,
  normalizeExecutionStackLines,
  parseStackCourseAccess,
  parseStackCourseTitle,
  type ArchetypeMapLineCategory,
  type ExecutionStackLineCategory,
} from "@/lib/quizArchetypeCourseLinks";
import {
  formatQuizSectionTitle,
  normalizeQuizReportLines,
} from "@/lib/quizResultReportFormat";
import {
  resolveWeaponNeonTheme,
  type CourseNeonTheme,
} from "@/lib/quizResultCourseNeon";

const CyberChamferFrame = dynamic(
  () =>
    import("@/components/cyber/CyberChamferFrames").then((m) => m.CyberChamferFrame),
  { ssr: true },
);

const PDF_VIRUS_HEADING_PREFIXES = new Set([
  "THE STING:",
  "THE REALITY:",
  "THE DIAGNOSIS:",
  "URGENCY OVERRIDE:",
]);

function stripSectionEFromReport(lines: string[]): string[] {
  const out: string[] = [];
  let skippingSectionE = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Section E:/i.test(trimmed)) {
      skippingSectionE = true;
      continue;
    }
    if (skippingSectionE && /^Section [A-D]:/i.test(trimmed)) {
      skippingSectionE = false;
    }
    if (skippingSectionE) continue;
    out.push(line);
  }
  return out;
}

function isPdfLeftAlignedLine(line: string): boolean {
  const trimmed = line.trim();
  if (/^(\d+\.\sTHE\s|STATUS:|ARCHETYPE:|DETECTED VIRUS:|WARNING:|•\s|• Course:|Why:)/.test(trimmed)) {
    return true;
  }
  for (const prefix of PDF_VIRUS_HEADING_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true;
  }
  return false;
}

type QuizResultPayload = {
  score?: number;
  category?: string;
  designation?: string;
  archetype?: string;
  fatal_flaw?: string;
  recommended_track?: string;
  ai_report?: string;
  archetype_catalog?: {
    business_models?: string[];
    psychology_paid?: string[];
    psychology_free?: string[];
    psychology?: string[];
  };
};

function parseQuizSectionMeta(title: string) {
  const match = title.match(/^Section\s+([A-Z])\s*:?\s*(.*)$/i);
  if (!match) {
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    return {
      id: `quiz-result-section-${slug || "section"}`,
      letter: null as string | null,
      shortLabel: title,
      fullTitle: "",
    };
  }
  const letter = match[1].toUpperCase();
  const rest = match[2]?.trim() ?? "";
  const formatted = formatQuizSectionTitle(`Section ${letter}: ${rest || " "}`);
  const titleBody = formatted.replace(/^Section\s+[A-Z]:\s*/i, "").trim();
  return {
    id: `quiz-result-section-${letter.toLowerCase()}`,
    letter,
    shortLabel: `Section ${letter}`,
    fullTitle: titleBody,
  };
}

function getCleanReportLines(report: string) {
  const lines = report
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => !line.startsWith("Section E:"))
    .filter((line) => !line.startsWith("Business Models:"))
    .filter((line) => !line.startsWith("Psychology (Paid"))
    .filter((line) => !line.startsWith("Psychology (Free"))
    .filter((line) => !line.startsWith("The Archetype (Skill Course Mapping)"))
    .filter((line) => !line.startsWith("Determined by the majority of answers in Q2 and Q6."))
    .filter((line) => !line.startsWith("• Ghost Architect:"))
    .filter((line) => !line.startsWith("• Attention Broker:"))
    .filter((line) => !line.startsWith("• System Architect:"))
    .filter((line) => !line.startsWith("• Profit Raider:"))
    .filter((line) => !line.startsWith("Selected Archetype:"))
    .filter((line) => !line.startsWith("Recommended Track:"))
    .filter((line) => !/project\s+obsidian/i.test(line))
    .filter((line) => !line.includes("THE SOVEREIGN ENTITY AUDIT: PROJECT OBSIDIAN"))
    .filter(
      (line) =>
        !line.startsWith("THE SOVEREIGN ENTITY AUDIT: DOSSIER") &&
        !line.startsWith("THE SYNDICATE DIAGNOSIS: DOSSIER"),
    );
  return normalizeQuizReportLines(lines);
}

function renderNeonCourseLine(
  key: string,
  displayLabel: string,
  courseValue: string,
  category: ArchetypeMapLineCategory,
  loginEmail: string,
  rowThemeOverride?: CourseNeonTheme
) {
  return (
    <QuizResultProgramCard
      key={key}
      courseValue={courseValue || displayLabel}
      category={category}
      loginEmail={loginEmail}
      rowThemeOverride={rowThemeOverride}
    />
  );
}

function renderExecutionStackCourseLine(
  key: string,
  rawCourse: string,
  courseValue: string,
  category: ArchetypeMapLineCategory,
  loginEmail: string,
  rowThemeOverride?: CourseNeonTheme
) {
  return (
    <QuizResultProgramCard
      key={key}
      courseValue={rawCourse || courseValue}
      category={category}
      loginEmail={loginEmail}
      rowThemeOverride={rowThemeOverride}
    />
  );
}

function isStackCourseFree(
  rawCourse: string,
  category: ArchetypeMapLineCategory,
): boolean {
  const courseValue = parseStackCourseTitle(rawCourse);
  const access = parseStackCourseAccess(rawCourse);
  return (
    access === "free" ||
    category === "free_psychology" ||
    isFreeTicketPsychologyCourse(courseValue)
  );
}

function renderExecutionStackSectionContent(
  content: string[],
  sectionTitle: string,
  loginEmail: string
) {
  type CourseBlock = {
    kind: "course";
    key: string;
    rawCourse: string;
    courseValue: string;
    category: ArchetypeMapLineCategory;
    weaponTheme?: CourseNeonTheme;
    isFree: boolean;
  };
  type OtherBlock = {
    kind: "other";
    node: ReactNode;
    key: string;
    isCategoryHeader?: boolean;
  };

  const freeCourses: CourseBlock[] = [];
  const rest: Array<CourseBlock | OtherBlock> = [];
  let stackCategory: ExecutionStackLineCategory = "other";
  let weaponRowIndex = 0;

  normalizeExecutionStackLines(content).forEach((line, idx) => {
    const headerCategory = classifyExecutionStackLine(line);
    if (headerCategory) {
      stackCategory = headerCategory;
      const matchedPrefix = ["1. THE WEAPON", "2. THE SHIELD", "3. THE PROTOCOL"].find((prefix) =>
        line.startsWith(prefix)
      );
      const node = matchedPrefix ? (
        <p key={`${sectionTitle}-hdr-${idx}`} className="result-line result-line-rich">
          <span className="result-key">{matchedPrefix}</span>{" "}
          {line.replace(matchedPrefix, "").trim()}
        </p>
      ) : (
        <p key={`${sectionTitle}-hdr-${idx}`} className="result-line result-line-rich result-map-category">
          {line}
        </p>
      );
      rest.push({
        kind: "other",
        node,
        key: `${sectionTitle}-hdr-${idx}`,
        isCategoryHeader: true,
      });
      return;
    }

    if (line.startsWith("• Course:") || line.startsWith("• ")) {
      const rawCourse = line.startsWith("• Course:")
        ? line.replace("• Course:", "").trim()
        : line.replace("• ", "").trim();
      const courseValue = parseStackCourseTitle(rawCourse);
      const actionCategory = executionStackCategoryToActionCategory(stackCategory, rawCourse);
      const weaponTheme =
        stackCategory === "weapon" ? resolveWeaponNeonTheme(weaponRowIndex++) : undefined;
      const block: CourseBlock = {
        kind: "course",
        key: `${sectionTitle}-${idx}`,
        rawCourse,
        courseValue,
        category: actionCategory,
        weaponTheme,
        isFree: isStackCourseFree(rawCourse, actionCategory),
      };
      if (block.isFree) freeCourses.push(block);
      else rest.push(block);
      return;
    }

    const keyPrefixes = ["Why:"];
    const matchedPrefix = keyPrefixes.find((prefix) => line.startsWith(prefix));
    if (matchedPrefix) {
      rest.push({
        kind: "other",
        key: `${sectionTitle}-${idx}`,
        node: (
          <p key={`${sectionTitle}-${idx}`} className="result-line result-line-rich">
            <span className="result-key">{matchedPrefix}</span>{" "}
            {line.replace(matchedPrefix, "").trim()}
          </p>
        ),
      });
      return;
    }
    rest.push({
      kind: "other",
      key: `${sectionTitle}-${idx}`,
      node: (
        <p key={`${sectionTitle}-${idx}`} className="result-line">
          {line}
        </p>
      ),
    });
  });

  const prunedRest: Array<CourseBlock | OtherBlock> = [];
  for (let i = 0; i < rest.length; i += 1) {
    const block = rest[i]!;
    if (block.kind === "other" && block.isCategoryHeader) {
      let hasCourse = false;
      for (let j = i + 1; j < rest.length; j += 1) {
        const next = rest[j]!;
        if (next.kind === "course") {
          hasCourse = true;
          break;
        }
        if (next.kind === "other" && next.isCategoryHeader) break;
      }
      if (!hasCourse) continue;
    }
    prunedRest.push(block);
  }

  const renderCourse = (block: CourseBlock) =>
    renderExecutionStackCourseLine(
      block.key,
      block.rawCourse,
      block.courseValue,
      block.category,
      loginEmail,
      block.weaponTheme,
    );

  return (
    <>
      {freeCourses.length > 0 ? (
        <div className="result-program-card-stack result-program-card-stack--free">
          {freeCourses.map(renderCourse)}
        </div>
      ) : null}
      <div className="result-program-card-stack">
        {prunedRest.map((block) =>
          block.kind === "course" ? renderCourse(block) : block.node,
        )}
      </div>
    </>
  );
}

function renderArchetypeMapSectionContent(
  content: string[],
  sectionTitle: string,
  loginEmail: string
) {
  type CourseBlock = {
    kind: "course";
    key: string;
    courseValue: string;
    category: ArchetypeMapLineCategory;
    weaponTheme?: CourseNeonTheme;
    isFree: boolean;
  };
  type OtherBlock = { kind: "other"; node: ReactNode };

  const freeCourses: CourseBlock[] = [];
  const rest: Array<CourseBlock | OtherBlock> = [];
  let category: ArchetypeMapLineCategory = "other";
  let weaponRowIndex = 0;

  content.forEach((line, idx) => {
    const headerCategory = classifyArchetypeMapLine(line);
    if (headerCategory) {
      category = headerCategory;
      rest.push({
        kind: "other",
        node: (
          <p key={`${sectionTitle}-hdr-${idx}`} className="result-line result-line-rich result-map-category">
            {line}
          </p>
        ),
      });
      return;
    }
    if (line.startsWith("• ")) {
      const courseValue = line.replace("• ", "").trim();
      const weaponTheme =
        category === "business" ? resolveWeaponNeonTheme(weaponRowIndex++) : undefined;
      const isFree =
        category === "free_psychology" || isFreeTicketPsychologyCourse(courseValue);
      const block: CourseBlock = {
        kind: "course",
        key: `${sectionTitle}-${idx}`,
        courseValue,
        category,
        weaponTheme,
        isFree,
      };
      if (isFree) freeCourses.push(block);
      else rest.push(block);
      return;
    }
    rest.push({
      kind: "other",
      node: (
        <p key={`${sectionTitle}-${idx}`} className="result-line">
          {line}
        </p>
      ),
    });
  });

  const renderCourse = (block: CourseBlock) =>
    renderNeonCourseLine(
      block.key,
      block.courseValue,
      block.courseValue,
      block.category,
      loginEmail,
      block.weaponTheme,
    );

  return (
    <>
      {freeCourses.length > 0 ? (
        <div className="result-program-card-stack result-program-card-stack--free">
          {freeCourses.map(renderCourse)}
        </div>
      ) : null}
      <div className="result-program-card-stack">
        {rest.map((block, i) =>
          block.kind === "course" ? renderCourse(block) : <span key={`map-other-${i}`}>{block.node}</span>,
        )}
      </div>
    </>
  );
}

function renderStyledReport(report: string, loginEmail: string) {
  const lines = getCleanReportLines(report);
  const sectionTitles = lines.filter((line) => line.startsWith("Section "));
  const visibleSectionTitles = sectionTitles.filter(
    (title) => !title.toLowerCase().includes("section e")
  );
  const sections = visibleSectionTitles.map((title, index) => {
    const start = lines.indexOf(title) + 1;
    const end =
      index < visibleSectionTitles.length - 1
        ? lines.indexOf(visibleSectionTitles[index + 1])
        : lines.length;
    return { title, content: lines.slice(start, end) };
  });

  const virusHeadings = new Set(["THE STING:", "THE REALITY:", "URGENCY OVERRIDE:"]);

  const keyPrefixes = [
    "STATUS:",
    "ARCHETYPE:",
    "ANALYSIS:",
    "DETECTED VIRUS:",
    "THE STING:",
    "THE REALITY:",
    "THE DIAGNOSIS:",
    "URGENCY OVERRIDE:",
    "WARNING:",
    "1. THE WEAPON",
    "2. THE SHIELD",
    "3. THE PROTOCOL",
  ];

  return (
    <>
      <div className="result-report-layout">
        <div className="section-cards-grid">
        {sections.map((section) => {
          const meta = parseQuizSectionMeta(section.title);
          const isVirusSection =
            section.title.toLowerCase().includes("section b") ||
            section.title.toLowerCase().includes("virus");
          return (
          <CyberChamferFrame
            key={section.title}
            accent={
              meta.letter === "A"
                ? "cyan"
                : meta.letter === "B"
                  ? "pink"
                  : meta.letter === "C"
                    ? "violet"
                    : "amber"
            }
            chamfer={18}
            className="quiz-result-section-frame w-full"
            innerClassName="p-0"
          >
            <article
              id={meta.id}
              className={`section-card${meta.letter ? ` section-card--${meta.letter.toLowerCase()}` : ""} scroll-mt-4${isVirusSection ? " section-card-virus" : ""}`}
            >
              <h3 className="result-subheading">{formatQuizSectionTitle(section.title)}</h3>
              {isArchetypeCourseMapSection(section.title)
                ? renderArchetypeMapSectionContent(section.content, section.title, loginEmail)
                : isExecutionStackSection(section.title)
                  ? renderExecutionStackSectionContent(section.content, section.title, loginEmail)
                  : section.content.map((line, idx) => {
              if (line.startsWith("• Course:")) {
                const courseValue = line.replace("• Course:", "").trim();
                const showFreeTicket = isFreeTicketPsychologyCourse(courseValue);
                const freeTicketHref = buildFreeTicketLoginHref(loginEmail, courseValue);
                return (
                  <p key={`${section.title}-${idx}`} className="result-line result-line-rich result-course-line">
                    <span className="result-key">Course:</span>{" "}
                    <span className="result-course-pill">{courseValue}</span>
                    {showFreeTicket ? (
                      <a className="result-ticket-btn" href={freeTicketHref}>
                        Get For Free
                      </a>
                    ) : null}
                  </p>
                );
              }
              if (line.startsWith("• ")) {
                const courseValue = line.replace("• ", "").trim();
                const showFreeTicket = isFreeTicketPsychologyCourse(courseValue);
                const freeTicketHref = buildFreeTicketLoginHref(loginEmail, courseValue);
                return (
                  <p key={`${section.title}-${idx}`} className="result-line result-line-rich result-course-line">
                    <span className="result-course-pill">{courseValue}</span>
                    {showFreeTicket ? (
                      <a className="result-ticket-btn" href={freeTicketHref}>
                        Get For Free
                      </a>
                    ) : null}
                  </p>
                );
              }
              const matchedPrefix = keyPrefixes.find((prefix) => line.startsWith(prefix));
              if (matchedPrefix) {
                const headingClass =
                  isVirusSection && virusHeadings.has(matchedPrefix)
                    ? "result-virus-heading"
                    : "result-key";
                return (
                  <p key={`${section.title}-${idx}`} className="result-line result-line-rich">
                    <span className={headingClass}>{matchedPrefix}</span>{" "}
                    {line.replace(matchedPrefix, "").trim()}
                  </p>
                );
              }
              return (
                <p key={`${section.title}-${idx}`} className="result-line">
                  {line}
                </p>
              );
              })}
            </article>
          </CyberChamferFrame>
        );
        })}
        </div>
      </div>
    </>
  );
}

export default function ResultPage() {
  const [result, setResult] = useState<QuizResultPayload | null>(null);
  const [quizEmail, setQuizEmail] = useState("");
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("quiz_result");
    const quizUserEmail = localStorage.getItem("quiz_user_email") || "";
    if (raw) {
      setResult(JSON.parse(raw) as QuizResultPayload);
    }
    setQuizEmail(quizUserEmail.trim().toLowerCase());
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("result-view");
    document.body.classList.add("result-view");
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.classList.remove("result-view");
      document.body.classList.remove("result-view");
    };
  }, []);

  if (!result) {
    return (
      <main className="page-wrap">
        <section className="card">
          <BrandHeader subtitle="No profile found yet. Complete the audit to generate your diagnosis." />
          <h2>Audit result not found</h2>
          <p>Complete The Syndicate Diagnosis first.</p>
          <Link href="/quiz/questions">
            <button className="btn btn-primary">Start Diagnosis</button>
          </Link>
        </section>
      </main>
    );
  }

  async function loadLogoDataUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png") as string);
      };
      img.onerror = () => reject(new Error("Failed to load logo"));
      img.src = "/quiz-funnel-logo.webp";
    });
  }

  async function downloadReportPdf() {
    const snapshot = result;
    if (!snapshot || downloadBusy) return;
    setDownloadBusy(true);
    try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const maxTextWidth = pageWidth - margin * 2;
    const pdfInnerPadX = 4;
    const pdfInnerPadY = 4;
    const pdfSectionGap = 4;
    let y = margin;

    const COLORS = {
      bg: [6, 10, 20] as const,
      panel: [10, 18, 34] as const,
      line: [76, 209, 255] as const,
      lineAccent: [171, 107, 255] as const,
      text: [220, 237, 255] as const,
      white: [245, 250, 255] as const,
      muted: [140, 162, 196] as const,
      gold: [217, 176, 71] as const,
      cyan: [76, 209, 255] as const,
      magenta: [171, 107, 255] as const,
      green: [92, 255, 138] as const,
      red: [255, 71, 87] as const,
      yellow: [255, 217, 61] as const,
      orange: [255, 159, 26] as const,
    };

    const paintPageBackground = () => {
      doc.setFillColor(...COLORS.bg);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFillColor(...COLORS.panel);
      doc.rect(margin - 18, margin - 18, pageWidth - (margin - 18) * 2, pageHeight - (margin - 18) * 2, "F");
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(1);
      doc.rect(margin - 18, margin - 18, pageWidth - (margin - 18) * 2, pageHeight - (margin - 18) * 2, "S");
      doc.setDrawColor(...COLORS.lineAccent);
      doc.setLineWidth(0.6);
      doc.line(margin - 18, margin - 8, pageWidth - margin + 18, margin - 8);
      doc.line(margin - 18, pageHeight - margin + 8, pageWidth - margin + 18, pageHeight - margin + 8);
    };

    paintPageBackground();

    try {
      const logoDataUrl = await loadLogoDataUrl();
      const logoWidth = 170;
      const logoHeight = 70;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoDataUrl, "PNG", logoX, y, logoWidth, logoHeight);
      y += logoHeight + 22;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.gold);
      doc.text("MONEY • POWER • FREEDOM • HONOUR", pageWidth / 2, y, { align: "center" });
      y += 26;
    } catch {
      // Continue PDF generation even if logo load fails.
    }

    const addLine = (
      text: string,
      fontSize = 12,
      style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
      color: Readonly<[number, number, number]> = COLORS.text,
      extraGap = 6,
      kind: string = "normal",
    ) => {
      doc.setFont("helvetica", style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const wrapped = doc.splitTextToSize(text, maxTextWidth);
      const lineHeight = fontSize + 5;
      const blockHeight = wrapped.length * lineHeight;
      const requiredHeight = blockHeight + (kind !== "normal" ? 14 : 0);
      if (y + blockHeight > pageHeight - margin) {
        doc.addPage();
        paintPageBackground();
        y = margin;
      }
      if (kind === "section" && y + requiredHeight > pageHeight - margin - 30) {
        doc.addPage();
        paintPageBackground();
        y = margin;
      }
      if (kind !== "normal") {
        const boxHeight = blockHeight + 6;
        if (kind === "section") {
          doc.setFillColor(17, 31, 56);
          doc.setDrawColor(...COLORS.gold);
        } else if (kind === "course") {
          doc.setFillColor(20, 18, 10);
          doc.setDrawColor(...COLORS.gold);
        } else {
          doc.setFillColor(12, 22, 40);
          doc.setDrawColor(...COLORS.cyan);
        }
        doc.setLineWidth(0.7);
        doc.roundedRect(margin - 6, y - fontSize + 2, maxTextWidth + 12, boxHeight, 6, 6, "FD");
      }
      doc.text(wrapped, margin, y);
      y += blockHeight + extraGap;
    };

    const addNewPage = () => {
      doc.addPage();
      paintPageBackground();
      y = margin;
    };

    const drawSectionCard = (sectionTitle: string, lines: string[]) => {
      const isSectionB = /Section B:/i.test(sectionTitle);
      const sectionBExtraPad = isSectionB ? pdfSectionGap * 2 : 0;
      const sectionBBottomReserve = isSectionB ? 22 : 8;
      y += pdfSectionGap;

      const textLeft = margin + 10 + pdfInnerPadX;
      const isFinalDirectiveSection = sectionTitle.startsWith("Section D");
      const rowFontSize = isFinalDirectiveSection ? 11 : 12;
      const rowLineAdvance = isFinalDirectiveSection ? 15 : 17;
      const rowGap = isSectionB ? 7 : isFinalDirectiveSection ? 4 : 5;
      const innerWidth = maxTextWidth - (isFinalDirectiveSection ? 44 : 38) - pdfInnerPadX * 2;

      const writeJustified = (text: string, startY: number) => {
        const body = text.trim();
        if (!body) return startY + rowGap;
        doc.text(body, textLeft, startY, { maxWidth: innerWidth, align: "justify" });
        const lineCount = doc.splitTextToSize(body, innerWidth).length;
        return startY + lineCount * rowLineAdvance + rowGap;
      };

      const writeStackFreeTagPdf = (startX: number, baselineY: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(rowFontSize);
        let x = startX;
        doc.setTextColor(...COLORS.white);
        doc.text(" (", x, baselineY);
        x += doc.getTextWidth(" (");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.green);
        doc.text("FREE", x, baselineY);
        x += doc.getTextWidth("FREE");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.white);
        doc.text(")", x, baselineY);
      };

      const writeStackCourseLinePdf = (line: string, baselineY: number) => {
        const raw = line.replace(/^•\s*/, "").trim();
        const title = parseStackCourseTitle(raw);
        const access = parseStackCourseAccess(raw);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(rowFontSize);
        doc.setTextColor(...COLORS.white);
        const prefix = "• ";
        let x = textLeft;
        doc.text(prefix, x, baselineY);
        x += doc.getTextWidth(prefix);
        doc.text(title, x, baselineY);
        if (access === "free") {
          x += doc.getTextWidth(title);
          writeStackFreeTagPdf(x, baselineY);
        }
        return baselineY + rowLineAdvance + rowGap;
      };

      const splitHeadingPrefix = (line: string) => {
        const prefixes = ["THE STING:", "THE REALITY:", "THE DIAGNOSIS:", "URGENCY OVERRIDE:"];
        const match = prefixes.find((prefix) => line.startsWith(prefix));
        if (!match) return null;
        return {
          label: match,
          value: line.slice(match.length).trim(),
        };
      };
      const wrappedLines = lines.map((line) => {
        const isHeading = /^(\d+\.\sTHE\s|STATUS:|ARCHETYPE:|ANALYSIS:|DETECTED VIRUS:|THE STING:|THE REALITY:|THE DIAGNOSIS:|URGENCY OVERRIDE:|WARNING:)/.test(
          line
        );
        const isCourse = line.startsWith("• Course:");
        const isWhy = line.startsWith("• Why:");
        const splitLabel = splitHeadingPrefix(line);
        let splitValueWrapped: string[] | null = null;
        if (splitLabel) {
          doc.setFont("helvetica", isHeading || isCourse ? "bold" : "normal");
          doc.setFontSize(rowFontSize);
          const labelText = `${splitLabel.label} `;
          const labelWidth = doc.getTextWidth(labelText);
          splitValueWrapped = doc.splitTextToSize(splitLabel.value, Math.max(120, innerWidth - labelWidth));
        }
        const effectiveWrapped = splitLabel ? splitValueWrapped ?? [""] : doc.splitTextToSize(line, innerWidth);
        return {
          line,
          wrapped: effectiveWrapped,
          isHeading,
          isCourse,
          isWhy,
          splitLabel,
          splitValueWrapped,
        };
      });

      const contentHeight =
        wrappedLines.reduce((sum, row) => sum + row.wrapped.length * rowLineAdvance + rowGap, 0) + 22;
      const cardHeight = 36 + contentHeight;
      const cardX = margin - 6;
      const cardW = maxTextWidth + 12;
      let currentIndex = 0;
      let firstChunk = true;

      while (currentIndex < wrappedLines.length) {
        const pageTopY = y;
        const titleBarHeight = 32;
        const contentTopY = pageTopY + titleBarHeight + 8;
        const availableBottomY = pageHeight - margin - 6;
        let cursorY = contentTopY;
        let endIndex = currentIndex;

        while (endIndex < wrappedLines.length) {
          const row = wrappedLines[endIndex];
          const rowHeight = row.wrapped.length * rowLineAdvance + rowGap;
          if (cursorY + rowHeight > availableBottomY) break;
          cursorY += rowHeight;
          endIndex += 1;
        }

        if (endIndex === currentIndex) {
          addNewPage();
          continue;
        }

        const cardHeightChunk = cursorY - pageTopY + sectionBBottomReserve + sectionBExtraPad * 2;
        doc.setFillColor(9, 16, 30);
        doc.setDrawColor(...COLORS.line);
        doc.setLineWidth(0.9);
        doc.roundedRect(cardX, pageTopY, cardW, cardHeightChunk, 8, 8, "FD");
        // Second border line for a proper double-line effect.
        doc.setDrawColor(...COLORS.lineAccent);
        doc.setLineWidth(0.55);
        doc.roundedRect(cardX + 2, pageTopY + 2, cardW - 4, cardHeightChunk - 4, 7, 7, "S");

        doc.setFillColor(18, 30, 54);
        doc.setDrawColor(...COLORS.gold);
        doc.roundedRect(cardX + 8, pageTopY + 8, cardW - 16, 24, 6, 6, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
      doc.setTextColor(...COLORS.magenta);
        doc.text(firstChunk ? sectionTitle : `${sectionTitle} (cont.)`, margin + 6 + pdfInnerPadX, pageTopY + 26);

        let sectionY = contentTopY + 6 + pdfInnerPadY + sectionBExtraPad;
        for (let i = currentIndex; i < endIndex; i += 1) {
          const row = wrappedLines[i];
          let color: Readonly<[number, number, number]> = COLORS.white;
          if (row.isCourse) color = COLORS.gold;
          else if (row.line.startsWith("WARNING:")) color = COLORS.magenta;
          else if (
            row.line.startsWith("ANALYSIS:") ||
            row.line.startsWith("THE STING:") ||
            row.line.startsWith("THE REALITY:") ||
            row.line.startsWith("THE DIAGNOSIS:") ||
            row.line.startsWith("URGENCY OVERRIDE:")
          ) {
            color = COLORS.white;
          }
          else if (row.isHeading) color = COLORS.cyan;
          else if (row.isWhy) color = COLORS.white;

          doc.setFont("helvetica", row.isHeading || row.isCourse ? "bold" : "normal");
          doc.setFontSize(rowFontSize);
          if (row.splitLabel) {
            const labelIsVirusHeading = PDF_VIRUS_HEADING_PREFIXES.has(row.splitLabel.label);
            doc.setFont("helvetica", labelIsVirusHeading || row.isHeading || row.isCourse ? "bold" : "normal");
            doc.setTextColor(...COLORS.cyan);
            doc.text(row.splitLabel.label, textLeft, sectionY);
            sectionY += rowLineAdvance;
            if (row.splitLabel.value) {
              doc.setFont("helvetica", "normal");
              doc.setTextColor(...COLORS.white);
              sectionY = writeJustified(row.splitLabel.value, sectionY);
            } else {
              sectionY += rowGap;
            }
          } else if (row.line.startsWith("ANALYSIS:")) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.cyan);
            doc.text("ANALYSIS:", textLeft, sectionY);
            sectionY += rowLineAdvance;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...COLORS.white);
            sectionY = writeJustified(row.line.replace("ANALYSIS:", ""), sectionY);
          } else if (
            row.line.startsWith("• ") &&
            !row.line.startsWith("• Course:") &&
            !row.isWhy &&
            parseStackCourseAccess(row.line.replace(/^•\s*/, "").trim())
          ) {
            sectionY = writeStackCourseLinePdf(row.line, sectionY);
          } else if (isPdfLeftAlignedLine(row.line) || row.isHeading || row.isCourse) {
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(row.wrapped, textLeft, sectionY);
            sectionY += row.wrapped.length * rowLineAdvance + rowGap;
          } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(color[0], color[1], color[2]);
            sectionY = writeJustified(row.line, sectionY);
          }
        }

        y = pageTopY + cardHeightChunk + pdfSectionGap;
        currentIndex = endIndex;
        firstChunk = false;
        if (currentIndex < wrappedLines.length) addNewPage();
      }
    };

    const drawSummaryCard = () => {
      const summaryLines = [
        { label: "Score:", value: `${snapshot.score} / 170` },
        { label: "Designation:", value: `${snapshot.designation || snapshot.category}` },
        { label: "Archetype:", value: `${snapshot.archetype}` },
        { label: "Detected Virus:", value: `${snapshot.fatal_flaw}` },
      ];
      const summaryValueColor = COLORS.cyan;

      const cardX = margin - 6;
      const cardY = y - 8;
      const cardW = maxTextWidth + 12;
      const lineHeight = 29;
      const cardH = 18 + summaryLines.length * lineHeight;

      if (cardY + cardH > pageHeight - margin) {
        addNewPage();
      }

      // Main card
      doc.setFillColor(11, 20, 36);
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.9);
      doc.roundedRect(cardX, cardY, cardW, cardH, 8, 8, "FD");

      // Shining dual border effect
      doc.setDrawColor(...COLORS.lineAccent);
      doc.setLineWidth(0.6);
      doc.roundedRect(cardX + 2, cardY + 2, cardW - 4, cardH - 4, 7, 7, "S");
      doc.setDrawColor(...COLORS.cyan);
      doc.setLineWidth(0.35);
      doc.roundedRect(cardX + 5, cardY + 5, cardW - 10, cardH - 10, 6, 6, "S");

      let lineY = cardY + 20 + pdfInnerPadY;
      const summaryTextX = margin + pdfInnerPadX;
      summaryLines.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...COLORS.white);
        const labelText = `${item.label} `;
        doc.text(labelText, summaryTextX, lineY);
        const labelWidth = doc.getTextWidth(labelText);
        doc.setTextColor(...summaryValueColor);
        doc.text(item.value, summaryTextX + labelWidth, lineY);
        lineY += lineHeight;
      });

      y = cardY + cardH + pdfSectionGap + 12;
    };

    drawSummaryCard();

    const reportLines = stripSectionEFromReport(getCleanReportLines(snapshot.ai_report ?? ""));
    const sectionTitles = reportLines.filter(
      (line) => line.startsWith("Section ") && !line.toLowerCase().includes("section e")
    );
    sectionTitles.forEach((title, idx) => {
      if (/^Section C:/i.test(title.trim())) {
        addNewPage();
      }
      const start = reportLines.indexOf(title) + 1;
      const end =
        idx < sectionTitles.length - 1 ? reportLines.indexOf(sectionTitles[idx + 1]!) : reportLines.length;
      const sectionBody = reportLines
        .slice(start, end)
        .filter(
          (line) =>
            line.trim() &&
            !line.startsWith("THE SOVEREIGN ENTITY AUDIT: DOSSIER") &&
            !line.startsWith("THE SYNDICATE DIAGNOSIS: DOSSIER") &&
            !/^Section E:/i.test(line.trim()) &&
            !line.startsWith("Business Models:") &&
            !line.startsWith("Psychology (Paid") &&
            !line.startsWith("Psychology (Free")
        );
      const normalizedBody = isExecutionStackSection(title)
        ? normalizeExecutionStackLines(sectionBody)
        : sectionBody;
      drawSectionCard(formatQuizSectionTitle(title), normalizedBody);
    });

    const filename = "Syndicate Diagnosis Report.pdf";

    const pdfBlob = doc.output("blob");
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    setDownloadReady(true);
    } finally {
      setDownloadBusy(false);
    }
  }

  return (
    <main className="page-wrap result-page-wrap">
      <section className="card result-page-shell">
        <BrandHeader subtitle="Your strategic report is ready." />
        {renderStyledReport(result.ai_report ?? "", quizEmail)}

        <div className="result-actions-footer">
          <button
            className="btn btn-primary result-download-btn"
            disabled={downloadBusy}
            onClick={() => void downloadReportPdf()}
          >
            {downloadBusy ? "PREPARING REPORT…" : "DOWNLOAD SYNDICATE DIAGNOSIS REPORT"}
          </button>
          {downloadReady ? (
            <p className="result-download-confirm">Report saved as &ldquo;Syndicate Diagnosis Report.pdf&rdquo;</p>
          ) : null}
          <Link href="/" className="result-home-btn" aria-label="Return to home">
            <svg
              className="result-home-btn__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V9.5" />
            </svg>
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
