import { SyndicateImageCopySection } from "@/components/syndicate/SyndicateImageCopySection";
import { HOME_SYNDICATE_SECTION_IMAGES } from "@/lib/homeSyndicateSectionImages";
import {
  getHomeStruggleParagraphs,
  getSyndicateCopy,
  getSyndicateCopyParagraphs,
} from "@/lib/syndicateWebsiteCopy";

/** Battle + struggle/comfort doctrine cards — shown above method split blocks. */
export function OurMethodsDoctrineIntro() {
  const battle = getSyndicateCopyParagraphs("Battle For Money And Power");
  const struggle = getHomeStruggleParagraphs();
  const struggleTitle =
    getSyndicateCopy("Success Is Born From Struggle")?.title ?? "Success Is Born From Struggle";
  const comfortTitle =
    getSyndicateCopy("And Failure Is Born From Comfort")?.title ?? "And Failure Is Born From Comfort";

  return (
    <div className="flex w-full flex-col gap-8 sm:gap-10 lg:gap-12">
      <SyndicateImageCopySection
        title="Battle For Money And Power"
        paragraphs={battle}
        imageSrc={HOME_SYNDICATE_SECTION_IMAGES.battle}
        imageAlt="Battle for money and power — Syndicate doctrine"
        variant="gold"
        priorityImage
      />
      <SyndicateImageCopySection
        title={`${struggleTitle} / ${comfortTitle}`}
        paragraphs={struggle}
        imageSrc={HOME_SYNDICATE_SECTION_IMAGES.struggle}
        imageAlt="Success from struggle and failure from comfort"
        variant="cyan"
      />
    </div>
  );
}
