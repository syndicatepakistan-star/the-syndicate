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

              <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(120px,0.9fr)] items-stretch gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(220px,0.95fr)] sm:gap-5 lg:gap-9">
                <div className="flex min-w-0 flex-col justify-center px-1 py-2 sm:px-3">
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

                <div className="grid min-h-[calc(13rem+100px)] grid-rows-[64px_minmax(0,1fr)] gap-2 sm:min-h-[calc(18rem+100px)] sm:grid-rows-[110px_minmax(0,1fr)] sm:gap-3">
                  <div className="relative overflow-hidden">
                    <Image
                      src={feature.logoSrc}
                      alt={`${feature.publisher} logo`}
                      fill
                      sizes="(max-width: 768px) 45vw, 42vw"
                      className="object-contain p-1 sm:p-3"
                    />
                  </div>
                  <a
                    href={feature.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read the ${feature.publisher} article: ${feature.title}`}
                    className="group relative min-h-[calc(9rem+100px)] overflow-hidden rounded-lg border border-white/15 bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:min-h-[calc(13rem+100px)]"
                  >
                    <Image
                      src={feature.articleImageSrc}
                      alt={`Guss Qureshi in the ${feature.publisher} feature`}
                      fill
                      sizes="(max-width: 768px) 45vw, 42vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                    <span
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5"
                      aria-hidden
                    />
                  </a>
                </div>
              </div>
            </article>
          </CyberChamferFrame>
        ))}
      </div>
    </section>
  );
}
