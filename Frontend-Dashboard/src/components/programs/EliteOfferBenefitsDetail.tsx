"use client";

import { type CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { GamingBenefitItem } from "@/components/GamingBenefitCards";
import {
  eliteOfferBenefitPanelProps,
  type PrimaryElitePlanKey,
} from "@/components/programs/planOfferCatalog";

type Props = {
  plan: PrimaryElitePlanKey;
  className?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.14 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function BenefitItem({ item, index }: { item: GamingBenefitItem; index: number }) {
  const hasBullets = Boolean(item.bullets && item.bullets.length > 0);
  const showDesc = !hasBullets && item.desc.trim() !== item.title.trim();

  return (
    <motion.article
      variants={itemVariants}
      className={cn("elite-benefit-detail__item", `elite-benefit-detail__item--${item.tone}`)}
    >
      <span
        className={cn("elite-benefit-detail__tag", `elite-benefit-detail__tag--${item.tone}`)}
        aria-hidden
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="elite-benefit-detail__copy">
        <strong className={cn("elite-benefit-detail__heading", `elite-benefit-detail__heading--${item.tone}`)}>
          {item.title}
        </strong>
        {hasBullets ? (
          <ul className="elite-benefit-detail__bullets">
            {item.bullets!.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : showDesc ? (
          <span className="elite-benefit-detail__desc">{item.desc}</span>
        ) : null}
      </div>
    </motion.article>
  );
}

export function EliteOfferBenefitsDetail({ plan, className }: Props) {
  const config = eliteOfferBenefitPanelProps(plan);
  const headingId = `elite-offer-benefits-${plan}`;

  return (
    <section className={cn("elite-benefit-detail", className)} aria-labelledby={headingId}>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        className="elite-benefit-detail__intro"
      >
        {config.intro}
      </motion.p>

      <motion.h3
        id={headingId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.1 }}
        className={cn(
          "elite-benefit-detail__title public-heading-lightning",
          config.titleLightning === "gold" && "public-heading-lightning--gold",
          config.titleLightning === "cyan" && "public-heading-lightning--cyan",
        )}
      >
        {config.benefitsTitle}
      </motion.h3>

      <motion.div
        className="elite-benefit-detail__grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ "--elite-benefit-accent": config.frameTone === "cyan" ? "#22d3ee" : "#4ade80" } as CSSProperties}
      >
        {config.items.map((item, index) => (
          <BenefitItem key={item.title} item={item} index={index} />
        ))}
      </motion.div>
    </section>
  );
}
