import Image from "next/image";
import {
  CyberChamferFrame,
  type CyberFrameAccent,
  cx,
} from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

export type SyndicateImageCopyVariant = "gold" | "cyan" | "amber";

const FRAME_ACCENT: Record<SyndicateImageCopyVariant, CyberFrameAccent> = {
  gold: "amber",
  cyan: "cyan",
  amber: "violet",
};

const INNER_BORDER: Record<SyndicateImageCopyVariant, string> = {
  gold: "border-amber-400/35 shadow-[inset_0_0_32px_rgba(251,191,36,0.08),0_0_24px_rgba(251,191,36,0.12)]",
  cyan: "border-cyan-400/35 shadow-[inset_0_0_32px_rgba(34,211,238,0.08),0_0_24px_rgba(34,211,238,0.12)]",
  amber: "border-fuchsia-400/35 shadow-[inset_0_0_32px_rgba(192,132,252,0.08),0_0_24px_rgba(168,85,247,0.12)]",
};

export type SyndicateImageCopyLayout = "wide" | "compact";

export type SyndicateImageCopySectionProps = {
  title: string;
  paragraphs: string[];
  imageSrc: string;
  imageAlt: string;
  variant?: SyndicateImageCopyVariant;
  priorityImage?: boolean;
  /** `compact` matches what-you-get / in-page card widths; `wide` is the home doctrine layout. */
  layout?: SyndicateImageCopyLayout;
};

export function SyndicateImageCopySection({
  title,
  paragraphs,
  imageSrc,
  imageAlt,
  variant = "gold",
  priorityImage = false,
  layout = "wide",
}: SyndicateImageCopySectionProps) {
  const compact = layout === "compact";
  const lightning =
    variant === "cyan" ? "cyan" : variant === "amber" ? "amber" : "gold";
  const frameAccent = FRAME_ACCENT[variant];

  return (
    <CyberChamferFrame accent={frameAccent} chamfer={22} className="w-full">
      <div className="p-5 sm:p-7 md:p-8">
        <h2
          className={cx(
            publicHeadingLightning(lightning),
            "text-balance text-center text-[clamp(1.35rem,3.2vw,2.35rem)] font-black uppercase leading-[1.05] tracking-[0.06em] sm:text-left"
          )}
        >
          {title}
        </h2>

        <div
          className={cx(
            "mt-5 overflow-hidden rounded-xl border-2 bg-black/45 backdrop-blur-[6px] sm:mt-6",
            INNER_BORDER[variant]
          )}
        >
          <div
            className={cx(
              "grid grid-cols-1 md:items-stretch",
              compact
                ? "md:grid-cols-[minmax(0,42%)_minmax(0,58%)] lg:grid-cols-[minmax(0,40%)_minmax(0,60%)] xl:grid-cols-[minmax(280px,38%)_minmax(0,62%)]"
                : "md:grid-cols-[minmax(0,58%)_minmax(0,42%)] lg:grid-cols-[minmax(0,62%)_minmax(0,38%)] xl:grid-cols-[minmax(0,65%)_minmax(0,35%)]"
            )}
          >
            <div
              className={cx(
                "relative aspect-[4/3] w-full border-b border-white/10 bg-[#030508] md:aspect-auto md:border-b-0 md:border-r md:border-white/10",
                compact
                  ? "min-h-[min(52vw,320px)] sm:min-h-[340px] md:min-h-[min(380px,48vh)] lg:min-h-[400px]"
                  : "min-h-[min(58vw,380px)] sm:min-h-[420px] md:min-h-[min(520px,72vh)] lg:min-h-[560px]"
              )}
            >
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes={
                  compact
                    ? "(max-width: 768px) 99vw, (max-width: 1280px) 42vw, 420px"
                    : "(max-width: 768px) 99vw, (max-width: 1536px) 62vw, 960px"
                }
                className="object-contain object-center p-1 sm:p-2"
                priority={priorityImage}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-black/35 md:via-transparent md:to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-auto md:max-w-[90%]"
                aria-hidden
              >
                <span
                  className={cx(
                    "inline-block rounded-md border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] backdrop-blur-sm sm:text-[11px]",
                    variant === "cyan"
                      ? "text-cyan-100"
                      : variant === "amber"
                        ? "text-fuchsia-100"
                        : "text-amber-100"
                  )}
                >
                  {title}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 lg:px-8">
              <div className="space-y-4">
                {paragraphs.map((p) => (
                  <p
                    key={p.slice(0, 48)}
                    className="text-justify text-[clamp(0.95rem,0.9vw+0.7rem,1.08rem)] font-medium leading-[1.65] text-zinc-100/90"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CyberChamferFrame>
  );
}
