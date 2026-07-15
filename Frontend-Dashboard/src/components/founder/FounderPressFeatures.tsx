import Image from "next/image";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { PRESS_FEATURES } from "@/lib/seo";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const ARTICLE_ACCENT_TEXT = {
  cyan: "text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.42)] group-hover:text-yellow-100",
  violet: "text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.35)] group-hover:text-fuchsia-100",
  amber: "text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] group-hover:text-amber-100",
} as const;

const PRESS_NAME: Record<string, string> = {
  "Forbes Georgia": "FORBES",
  "GQ South Africa": "GQ",
  "Luxury Lifestyle Magazine": "LLM",
} as const;

const ARTICLE_TITLE_LINES: Record<string, string[]> = {
  "Forbes Georgia": [
    "How The Syndicate Uses",
    "Mastery And Empowerment",
    "To Redefine Business",
  ],
  "GQ South Africa": [
    "How The Syndicate Can",
    "Disrupt The Traditional",
    "Model Of Influence And",
    "Education In The Digital Age",
  ],
  "Luxury Lifestyle Magazine": [
    "How The Syndicate Empowers",
    "Individuals To Master Power,",
    "Money, And Influence",
  ],
};

/** Fixed-height frame: full screenshot visible (scaled), still aligned with text. */
const ARTICLE_SCREENSHOT_FRAME: Record<string, string> = {
  "Forbes Georgia": "h-[min(34rem,70vh)] max-h-[34rem]",
  "GQ South Africa": "h-[min(34rem,70vh)] max-h-[34rem]",
  "Luxury Lifestyle Magazine": "h-[min(28rem,60vh)] max-h-[28rem]",
};

const ARTICLE_SCREENSHOT_FIT: Record<string, string> = {
  "Forbes Georgia": "object-contain object-top",
  "GQ South Africa": "object-contain object-top",
  "Luxury Lifestyle Magazine": "object-contain object-center",
};

export function FounderPressFeatures() {
  return (
    <section
      aria-label="The Syndicate in the press"
      className="mx-auto w-full max-w-[min(100%,1400px)] px-3 pb-7 sm:px-6 sm:pb-10 md:px-8"
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        {PRESS_FEATURES.map((feature) => (
          <CyberChamferFrame
            key={feature.url}
            accent={feature.accent}
            chamfer={22}
            className="w-full"
            innerClassName="px-5 py-[70px] sm:px-7 sm:py-[78px] lg:px-9 lg:py-[86px]"
            contentClassName="h-full"
          >
            <article className="flex min-h-[22rem] flex-col text-left">
              <h2
                className={`${publicHeadingLightning(feature.accent)} hamburger-attract mb-5 text-center text-[clamp(1.35rem,4vw,3.2rem)] font-black uppercase leading-none tracking-[0.08em] sm:mb-7`}
              >
                As Covered in {PRESS_NAME[feature.publisher]}
              </h2>

              <div className="grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)] lg:gap-9">
                <div className="flex min-w-0 flex-col justify-start px-1 py-2 sm:px-3 sm:pt-4">
                  <a
                    href={feature.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  >
                    <h3
                      className={`text-[clamp(0.72rem,2vw,1.8rem)] font-black uppercase leading-[1.15] tracking-[0.025em] transition-colors ${ARTICLE_ACCENT_TEXT[feature.accent]}`}
                    >
                      {(ARTICLE_TITLE_LINES[feature.publisher] ?? [feature.title]).map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </h3>
                  </a>
                  <p className="mt-4 max-w-3xl text-xs leading-[1.75] text-zinc-100/90 sm:mt-6 sm:text-lg sm:leading-[1.8] lg:text-xl">
                    {feature.description}
                  </p>
                </div>

                <a
                  href={feature.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read the ${feature.publisher} article: ${feature.title}`}
                  className={`group relative mx-auto w-full max-w-[40rem] overflow-hidden rounded-lg border border-white/15 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${ARTICLE_SCREENSHOT_FRAME[feature.publisher] ?? "h-[min(32rem,65vh)]"}`}
                >
                  <Image
                    src={feature.articleImageSrc}
                    alt={`Screenshot of The Syndicate's ${feature.publisher} feature`}
                    fill
                    sizes="(max-width: 1024px) 94vw, 54vw"
                    className={`transition-transform duration-500 group-hover:scale-[1.012] ${ARTICLE_SCREENSHOT_FIT[feature.publisher] ?? "object-contain object-center"}`}
                  />
                </a>
              </div>
            </article>
          </CyberChamferFrame>
        ))}
      </div>
    </section>
  );
}
