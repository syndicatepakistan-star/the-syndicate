"use client";

import { cn } from "@/components/dashboard/dashboardPrimitives";

export type GamingBenefitTone = "cyan" | "violet" | "gold" | "pink" | "amber" | "green";

export type GamingBenefitItem = {
  tone: GamingBenefitTone;
  title: string;
  desc: string;
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
              <span>{item.desc}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
