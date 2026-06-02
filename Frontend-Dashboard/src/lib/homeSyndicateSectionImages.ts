/** Refined marketing images — `public/assets/refined content images/` */

const REFINED_CONTENT_IMAGES_DIR = "/assets/refined content images";

function refinedContentImage(filename: string): string {
  return `${REFINED_CONTENT_IMAGES_DIR}/${encodeURIComponent(filename)}`;
}

export const HOME_SYNDICATE_SECTION_IMAGES = {
  battle: refinedContentImage("battle for money and power.jpg"),
  struggle: refinedContentImage(
    "success is born from struggle and failure is born from comfort.jpg"
  ),
  secret: refinedContentImage("the syndicate secret technique.jpg"),
  master: refinedContentImage("become a master.jpg"),
} as const;
