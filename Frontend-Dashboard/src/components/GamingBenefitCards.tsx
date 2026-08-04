"use client";

import "@/styles/gaming-benefit-cards.css";
import { cn } from "@/components/dashboard/dashboardPrimitives";

export type GamingBenefitTone = "cyan" | "violet" | "gold" | "pink" | "amber" | "green" | "orange";

export type GamingBenefitItem = {
  tone: GamingBenefitTone;
  title: string;
  /** Second title line (same styling) — e.g. "Build 30 AI Projects". */
  titleLine2?: string;
  desc: string;
  /** Optional bullet list (preferred over `desc` when present). */
  bullets?: readonly string[];
  /** Mid-ticket pack to open from a CTA inside Money Mastery details. */
  ctaPackPlan?: "agentic_ai" | "ai_content_automation" | "trading_technical_analysis";
  /** Line above the Details button — e.g. "View all of Agentic AI Pack". */
  ctaHint?: string;
  /** Button label (default: Details). */
  ctaLabel?: string;
};

type FrameTone = "green" | "cyan";

type Props = {
  title: string;
  items: readonly GamingBenefitItem[];
  frameTone?: FrameTone;
  titleLightning?: "cyan" | "gold" | "violet";
  className?: string;
  id?: string;
  headingId?: string;
};

export function GamingBenefitCards({
  title,
  items,
  frameTone = "green",
  titleLightning = "cyan",
  className,
  id,
  headingId,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        "gaming-benefit gaming-benefit-card gaming-benefit-frame",
        frameTone === "cyan" ? "gaming-benefit-card--cyan" : "gaming-benefit-card--green",
        className,
      )}
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        className={cn(
          "gaming-benefit-title public-heading-lightning",
          titleLightning === "gold" && "public-heading-lightning--gold",
          titleLightning === "violet" && "public-heading-lightning--violet",
          titleLightning === "cyan" && "public-heading-lightning--cyan",
        )}
      >
        {title}
      </h3>
      <div className="gaming-benefit-grid">
        {items.map((item, index) => (
          <article
            key={item.title}
            className={cn("gaming-benefit-item", `gaming-benefit-item--${item.tone}`)}
          >
            <span className="gaming-benefit-tag" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="gaming-benefit-copy">
              <strong>{item.title}</strong>
              {item.bullets && item.bullets.length > 0 ? (
                <ul className="gaming-benefit-bullets">
                  {item.bullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <span>{item.desc}</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
