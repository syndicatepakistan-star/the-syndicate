"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import BrandHeader from "@/components/quiz-funnel/BrandHeader";

const TRACK_BY_ARCHETYPE = {
  "Ghost Architect": "AI Agents and automated software bots.",
  "Attention Broker": "Faceless content and digital influence.",
  "System Architect": "Global logistics and automated publishing.",
  "Profit Raider": "Crypto markets and Blockchain loops.",
};

type QuizResultPayload = {
  score?: number;
  category?: string;
  designation?: string;
  archetype?: string;
  fatal_flaw?: string;
  recommended_track?: string;
  ai_report?: string;
};

function getCleanReportLines(report: string) {
  return report
    .split("\n")
    .filter((line) => line.trim() !== "")
    .filter((line) => !line.startsWith("The Archetype (Skill Course Mapping)"))
    .filter((line) => !line.startsWith("Determined by the majority of answers in Q2 and Q6."))
    .filter((line) => !line.startsWith("• Ghost Architect:"))
    .filter((line) => !line.startsWith("• Attention Broker:"))
    .filter((line) => !line.startsWith("• System Architect:"))
    .filter((line) => !line.startsWith("• Profit Raider:"))
    .filter((line) => !line.startsWith("Selected Archetype:"))
    .filter((line) => !line.startsWith("Recommended Track:"));
}

function renderStyledReport(report: string, loginEmail: string) {
  const lines = getCleanReportLines(report);
  const reportTitle = lines.find((line) => line.startsWith("THE SOVEREIGN ENTITY AUDIT: DOSSIER"));
  const sectionTitles = lines.filter((line) => line.startsWith("Section "));
  const sections = sectionTitles.map((title, index) => {
    const start = lines.indexOf(title) + 1;
    const end = index < sectionTitles.length - 1 ? lines.indexOf(sectionTitles[index + 1]) : lines.length;
    return { title, content: lines.slice(start, end) };
  });

  const keyPrefixes = [
    "STATUS:",
    "ARCHETYPE:",
    "ANALYSIS:",
    "DETECTED VIRUS:",
    "THE STING:",
    "THE DIAGNOSIS:",
    "URGENCY OVERRIDE:",
    "WARNING:",
    "1. THE WEAPON",
    "2. THE SHIELD",
    "3. THE PROTOCOL",
  ];

  return (
    <>
      {reportTitle ? (
        <h2 className="result-heading public-heading-lightning public-heading-lightning--violet">{reportTitle}</h2>
      ) : null}
      <div className="section-cards-grid">
        {sections.map((section) => (
          <article key={section.title} className="section-card">
            <h3 className="result-subheading">{section.title}</h3>
            {section.content.map((line, idx) => {
              if (line.startsWith("• Course:")) {
                const nearestTrackHeading = [...section.content]
                  .slice(0, idx)
                  .reverse()
                  .find((entry) => /^\d+\.\sTHE\s/.test(entry));
                const normalizedHeading = (nearestTrackHeading || "").trim().toUpperCase();
                const isWeaponCourse = normalizedHeading.startsWith("1. THE WEAPON");
                const courseValue = line.replace("• Course:", "").trim();
                const normalizedCourse = courseValue.toUpperCase();
                const isBusinessModelCourse =
                  normalizedCourse.includes("FACELESS YOUTUBE AI") ||
                  normalizedCourse.includes("UNREAL ENGINE");
                const showFreeTicket = !isWeaponCourse && !isBusinessModelCourse;
                const freeTicketHref = `/login?email=${encodeURIComponent(loginEmail)}&ticket=${encodeURIComponent(courseValue)}&next=${encodeURIComponent("/dashboard?section=programs")}`;
                return (
                  <p key={`${section.title}-${idx}`} className="result-line result-line-rich result-course-line">
                    <span className="result-key">Course:</span>{" "}
                    <span className="result-course-pill">{courseValue}</span>
                    {showFreeTicket ? (
                      <a className="result-ticket-btn" href={freeTicketHref}>
                        Get Free Ticket
                      </a>
                    ) : null}
                  </p>
                );
              }
              const matchedPrefix = keyPrefixes.find((prefix) => line.startsWith(prefix));
              if (matchedPrefix) {
                return (
                  <p key={`${section.title}-${idx}`} className="result-line result-line-rich">
                    <span className="result-key">{matchedPrefix}</span>{" "}
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
        ))}
      </div>
    </>
  );
}

export default function ResultPage() {
  const [result, setResult] = useState<QuizResultPayload | null>(null);
  const [quizEmail, setQuizEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("quiz_result");
    const quizUserEmail = localStorage.getItem("quiz_user_email") || "";
    if (raw) {
      setResult(JSON.parse(raw) as QuizResultPayload);
    }
    setQuizEmail(quizUserEmail.trim().toLowerCase());
  }, []);

  useEffect(() => {
    document.body.classList.add("result-view");
    return () => {
      document.body.classList.remove("result-view");
    };
  }, []);

  if (!result) {
    return (
      <main className="page-wrap">
        <section className="card">
          <BrandHeader subtitle="No profile found yet. Complete the audit to generate your Project Obsidian diagnosis." />
          <h2>Audit result not found</h2>
          <p>Complete the Sovereign Entity Audit first.</p>
          <Link href="/quiz/questions">
            <button className="btn btn-primary">Begin Audit</button>
          </Link>
        </section>
      </main>
    );
  }

  const archetypeKey = result.archetype as keyof typeof TRACK_BY_ARCHETYPE | undefined;
  const resolvedTrack =
    result.recommended_track ??
    (archetypeKey ? TRACK_BY_ARCHETYPE[archetypeKey] : undefined) ??
    "Track to be assigned";

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
    if (!snapshot) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const maxTextWidth = pageWidth - margin * 2;
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
      const textLeft = margin + 10;
      const isFinalDirectiveSection = sectionTitle.startsWith("Section D");
      const rowFontSize = isFinalDirectiveSection ? 11 : 12;
      const rowLineAdvance = isFinalDirectiveSection ? 15 : 17;
      const rowGap = isFinalDirectiveSection ? 4 : 5;
      const innerWidth = maxTextWidth - (isFinalDirectiveSection ? 44 : 38);
      const splitHeadingPrefix = (line: string) => {
        const prefixes = ["THE STING:", "THE DIAGNOSIS:", "URGENCY OVERRIDE:"];
        const match = prefixes.find((prefix) => line.startsWith(prefix));
        if (!match) return null;
        return {
          label: match,
          value: line.slice(match.length).trim(),
        };
      };
      const wrappedLines = lines.map((line) => {
        const isHeading = /^(\d+\.\sTHE\s|STATUS:|ARCHETYPE:|ANALYSIS:|DETECTED VIRUS:|THE STING:|THE DIAGNOSIS:|URGENCY OVERRIDE:|WARNING:)/.test(
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
        const pageTopY = y - 14;
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

        const cardHeightChunk = cursorY - pageTopY + 8;
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
        doc.text(firstChunk ? sectionTitle : `${sectionTitle} (cont.)`, margin + 6, pageTopY + 26);

        let sectionY = contentTopY + 6;
        for (let i = currentIndex; i < endIndex; i += 1) {
          const row = wrappedLines[i];
          let color: Readonly<[number, number, number]> = COLORS.white;
          if (row.isCourse) color = COLORS.gold;
          else if (row.line.startsWith("WARNING:")) color = COLORS.magenta;
          else if (
            row.line.startsWith("ANALYSIS:") ||
            row.line.startsWith("THE STING:") ||
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
            // Color heading label, keep value/body white.
            const labelText = `${row.splitLabel.label} `;
            doc.setTextColor(...COLORS.cyan);
            doc.text(labelText, textLeft, sectionY);
            const labelWidth = doc.getTextWidth(labelText);
            doc.setTextColor(...COLORS.white);
            const valueWrapped = row.splitValueWrapped ?? doc.splitTextToSize(row.splitLabel.value, Math.max(120, innerWidth - labelWidth));
            if (valueWrapped.length > 0) {
              doc.text(valueWrapped[0], textLeft + labelWidth, sectionY);
            }
            if (valueWrapped.length > 1) {
              doc.text(valueWrapped.slice(1), textLeft, sectionY + rowLineAdvance);
            }
            sectionY += valueWrapped.length * rowLineAdvance + rowGap;
          } else {
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(row.wrapped, textLeft, sectionY);
            sectionY += row.wrapped.length * rowLineAdvance + rowGap;
          }
        }

        y = pageTopY + cardHeightChunk + 16;
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
        { label: "Recommended Track:", value: `${resolvedTrack}` },
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

      let lineY = cardY + 20;
      summaryLines.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...COLORS.white);
        const labelText = `${item.label} `;
        doc.text(labelText, margin, lineY);
        const labelWidth = doc.getTextWidth(labelText);
        doc.setTextColor(...summaryValueColor);
        doc.text(item.value, margin + labelWidth, lineY);
        lineY += lineHeight;
      });

      y = cardY + cardH + 18;
    };

    addLine("THE SOVEREIGN ENTITY AUDIT: PROJECT OBSIDIAN", 18, "bold", COLORS.gold, 12);
    y += 6;

    drawSummaryCard();

    const reportLines = getCleanReportLines(snapshot.ai_report ?? "");
    const sectionTitles = reportLines.filter((line) => line.startsWith("Section "));
    sectionTitles.forEach((title, idx) => {
      const start = reportLines.indexOf(title) + 1;
      const end = idx < sectionTitles.length - 1 ? reportLines.indexOf(sectionTitles[idx + 1]) : reportLines.length;
      const sectionBody = reportLines
        .slice(start, end)
        .filter((line) => line.trim() && !line.startsWith("THE SOVEREIGN ENTITY AUDIT: DOSSIER"));
      drawSectionCard(title, sectionBody);
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `project-obsidian-report-${timestamp}.pdf`;

    // Use blob download to avoid browser navigating to broken file:// URLs.
    const pdfBlob = doc.output("blob");
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    // Give the browser a brief moment to start the download before redirecting.
    window.setTimeout(() => {
      router.push("/");
    }, 350);
  }

  return (
    <main className="page-wrap">
      <section className="card result-page-shell">
        <BrandHeader subtitle="Your strategic report is ready." />
        <div className="result-summary-panel hud-frame">
          <div className="result-hud-topbar">
            <span className="hud-chip">MISSION REPORT</span>
            <span className="hud-chip hud-chip-accent">PROJECT OBSIDIAN</span>
          </div>
          <h2 className="section-title public-heading-lightning public-heading-lightning--violet">TACTICAL DIAGNOSIS BOARD</h2>
          <div className="result-summary-grid">
            <div className="summary-item">
              <p className="summary-label">Combat Score</p>
              <p className="summary-value">{result.score} / 170</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Current Rank</p>
              <p className="summary-value">{result.designation || result.category}</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Operator Archetype</p>
              <p className="summary-value">{result.archetype}</p>
            </div>
            <div className="summary-item">
              <p className="summary-label">Critical Weakness</p>
              <p className="summary-value">{result.fatal_flaw}</p>
            </div>
          </div>
          <p className="section-subtitle">
            <strong>About The Syndicate:</strong> The Syndicate is built to convert raw hustle into a
            disciplined execution stack through skills, psychology, and strategic operating rules.
          </p>
        </div>
        {renderStyledReport(result.ai_report ?? "", quizEmail)}

        <button className="btn btn-primary result-download-btn" onClick={() => void downloadReportPdf()}>
          DOWNLOAD THE BLUEPRINT &amp; ENTER THE SYNDICATE
        </button>
      </section>
    </main>
  );
}
