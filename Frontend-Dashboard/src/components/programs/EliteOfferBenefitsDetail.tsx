"use client";

import { motion } from "framer-motion";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import {
  eliteOfferBenefitPanelProps,
  type PrimaryElitePlanKey,
} from "@/components/programs/planOfferCatalog";
import { MoneyMasteryCardInclusions } from "@/components/programs/MoneyMasteryCardInclusions";
import { highlightOfferStatFigures } from "@/components/programs/highlightOfferStatFigures";
import type { GamingBenefitItem } from "@/components/GamingBenefitCards";

type Props = {
  plan: PrimaryElitePlanKey;
  className?: string;
};

const manifestVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const manifestRowVariants = {
  hidden: { opacity: 0, x: -14 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/** Inventory-manifest layout — list rows, not cards. */
function WhatYouGetManifest({
  headingId,
  title,
  items,
  footer,
}: {
  headingId: string;
  title: string;
  items: readonly GamingBenefitItem[];
  footer?: string | null;
}) {
  return (
    <section
      className="elite-benefit-detail__section elite-benefit-detail__section--what-you-get elite-mm-manifest"
      aria-labelledby={headingId}
    >
      <div className="elite-mm-manifest__header">
        <span className="elite-mm-manifest__eyebrow" aria-hidden>
          Inventory · Included
        </span>
        <motion.h3
          id={headingId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="elite-mm-manifest__title"
        >
          {title}
        </motion.h3>
        <div className="elite-mm-manifest__rule" aria-hidden />
      </div>

      <motion.ol
        className="elite-mm-manifest__list"
        variants={manifestVariants}
        initial="hidden"
        animate="show"
      >
        {items.map((item) => (
          <motion.li
            key={item.title}
            variants={manifestRowVariants}
            className={cn("elite-mm-manifest__row elite-mm-manifest__row--card", `elite-mm-manifest__row--${item.tone}`)}
          >
            <div className="elite-mm-manifest__body">
              <strong className="elite-mm-manifest__pack">{item.title}</strong>
              <p className="elite-mm-manifest__meta">{highlightOfferStatFigures(item.desc)}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      {footer ? <p className="elite-mm-manifest__footer">{footer}</p> : null}
    </section>
  );
}

/**
 * Lifetime access — dossier cards (always visible; no blur/opacity-0 traps).
 * Visually opposite of the flat inventory list above.
 */
function LifetimeAccessSection({
  headingId,
  title,
  items,
}: {
  headingId: string;
  title: string;
  items: readonly GamingBenefitItem[];
}) {
  return (
    <section
      className="elite-benefit-detail__section elite-benefit-detail__section--lifetime elite-mm-lifetime"
      aria-labelledby={headingId}
    >
      <div className="elite-mm-lifetime__header">
        <span className="elite-mm-lifetime__eyebrow" aria-hidden>
          Vault · Lifetime unlock
        </span>
        <h3 id={headingId} className="elite-mm-lifetime__title public-heading-lightning public-heading-lightning--cyan">
          {title}
        </h3>
        <p className="elite-mm-lifetime__sub">
          Every programme, pack, and platform path included in Money Mastery — permanent access.
        </p>
      </div>

      <div className="elite-mm-lifetime__grid">
        {items.map((item, index) => {
          const hasBullets = Boolean(item.bullets && item.bullets.length > 0);
          return (
            <article
              key={item.title}
              className={cn("elite-mm-lifetime__card", `elite-mm-lifetime__card--${item.tone}`)}
            >
              <header className="elite-mm-lifetime__card-head">
                <span className="elite-mm-lifetime__badge" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4 className="elite-mm-lifetime__card-title">{item.title}</h4>
              </header>
              {item.desc.trim() && item.desc.trim() !== item.title.trim() ? (
                <p className="elite-mm-lifetime__card-desc">{highlightOfferStatFigures(item.desc)}</p>
              ) : null}
              {hasBullets ? (
                <ul className="elite-mm-lifetime__bullets">
                  {item.bullets!.map((line) => (
                    <li key={line}>{highlightOfferStatFigures(line)}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function EliteOfferBenefitsDetail({ plan, className }: Props) {
  const config = eliteOfferBenefitPanelProps(plan);
  const whatYouGetId = `elite-offer-what-you-get-${plan}`;
  const lifetimeId = `elite-offer-benefits-${plan}`;
  const hasWhatYouGet = Boolean(config.whatYouGetItems?.length && config.whatYouGetTitle);

  return (
    <div className={cn("elite-benefit-detail", className)}>
      {plan === "bundle" ? (
        <section aria-labelledby={whatYouGetId} className="mb-6">
          <h3 id={whatYouGetId} className="sr-only">
            {config.whatYouGetTitle ?? "What You Get"}
          </h3>
          <MoneyMasteryCardInclusions className="mx-auto max-w-2xl" />
          {config.whatYouGetFooter ? (
            <p className="elite-mm-manifest__footer mt-4">{config.whatYouGetFooter}</p>
          ) : null}
        </section>
      ) : hasWhatYouGet ? (
        <WhatYouGetManifest
          headingId={whatYouGetId}
          title={config.whatYouGetTitle!}
          items={config.whatYouGetItems!}
          footer={config.whatYouGetFooter}
        />
      ) : null}

      <p className="elite-benefit-detail__intro">{config.intro}</p>

      <LifetimeAccessSection headingId={lifetimeId} title={config.benefitsTitle} items={config.items} />
    </div>
  );
}
