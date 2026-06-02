import { SyndicateImageCopySection } from "@/components/syndicate/SyndicateImageCopySection";
import { HOME_SYNDICATE_SECTION_IMAGES } from "@/lib/homeSyndicateSectionImages";
import { getSyndicateCopyParagraphs } from "@/lib/syndicateWebsiteCopy";

/** Secret techniques + Become a master — shown above the royal path block on What You Get. */
export function WhatYouGetDoctrineSections() {
  const secret = getSyndicateCopyParagraphs("THE SYNDICATE SECRET TECHNIQUES");
  const master = getSyndicateCopyParagraphs("BECOME A MASTER");

  return (
    <section
      aria-label="Syndicate techniques and mastery"
      className="px-[clamp(1rem,3vw,2.2rem)] pb-10 pt-2 sm:pb-12 sm:pt-4"
    >
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8 sm:gap-10 lg:gap-12">
        <SyndicateImageCopySection
          title="The Syndicate Secret Techniques"
          paragraphs={secret}
          imageSrc={HOME_SYNDICATE_SECTION_IMAGES.secret}
          imageAlt="The Syndicate secret techniques"
          variant="amber"
          layout="compact"
          priorityImage
        />
        <SyndicateImageCopySection
          title="Become A Master"
          paragraphs={master}
          imageSrc={HOME_SYNDICATE_SECTION_IMAGES.master}
          imageAlt="Become a master — Syndicate programmes"
          variant="gold"
          layout="compact"
        />
      </div>
    </section>
  );
}
