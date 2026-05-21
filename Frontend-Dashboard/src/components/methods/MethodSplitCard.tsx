import Image from "next/image";
import {
  CyberChamferFrame,
  CyberInsetPanel,
  type CyberFrameAccent,
} from "@/components/cyber/CyberChamferFrames";
import { MethodCtaButtons } from "@/components/methods/MethodCtaButtons";
import { ViewportDecorVideo } from "@/components/ViewportDecorVideo";

export type MethodSplitAccent = "cyan" | "violet" | "amber";

export type MethodSplitCardProps = {
  accent: MethodSplitAccent;
  title: string;
  summary: string;
  paragraphs: [string, string];
  image?: string;
  imageAlt: string;
  videoSrc?: string;
  keySrc?: string;
  footerEmphasis?: string;
  moneyPowerTitle?: boolean;
};

/** Matches Our Methods hero h1 scale and rhythm */
const METHOD_TITLE_BASE =
  "text-[clamp(2.2rem,5.4vw,5.2rem)] font-black uppercase leading-[0.9] tracking-[0.1em]";

const TITLE_CLASS: Record<MethodSplitAccent, string> = {
  cyan: "text-cyan-100 drop-shadow-[0_0_18px_rgba(34,211,238,0.52)]",
  violet: "text-fuchsia-100 drop-shadow-[0_0_18px_rgba(217,70,239,0.52)]",
  amber: "text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.52)]",
};

function frameAccent(accent: MethodSplitAccent): CyberFrameAccent {
  return accent === "cyan" ? "cyan" : accent === "violet" ? "violet" : "amber";
}

export function MethodSplitCard({
  accent,
  title,
  summary,
  paragraphs,
  image,
  imageAlt,
  videoSrc,
  keySrc,
  footerEmphasis,
  moneyPowerTitle = false,
}: MethodSplitCardProps) {
  const hasVideo = Boolean(videoSrc?.trim());
  const hasKey = Boolean(keySrc?.trim());
  const hasImage = Boolean(image?.trim()) && !hasKey;

  return (
    <CyberChamferFrame
      accent={frameAccent(accent)}
      chamfer={22}
      className="w-full"
      innerClassName="p-6 sm:p-8 lg:p-10"
    >
      <div className="grid gap-6 text-left lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)] lg:items-stretch xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] xl:gap-10">
        <div className="flex min-w-0 flex-col justify-center">
          {moneyPowerTitle ? (
            <div className="mb-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-rose-400/85 sm:text-[11px]">
                Vault channel // power doctrine
              </p>
              <h2 className={`mt-3 ${METHOD_TITLE_BASE} ${TITLE_CLASS[accent]}`}>{title}</h2>
            </div>
          ) : (
            <h2 className={`${METHOD_TITLE_BASE} ${TITLE_CLASS[accent]}`}>{title}</h2>
          )}

          {moneyPowerTitle ? (
            <CyberInsetPanel variant="blood" className="mt-4">
              <p className="text-lg leading-relaxed text-zinc-100/90 sm:text-xl">{summary}</p>
            </CyberInsetPanel>
          ) : (
            <p className="mt-3 text-lg leading-relaxed text-zinc-100/88 sm:text-xl">{summary}</p>
          )}

          <div className="mt-5 grid gap-3 sm:gap-4">
            <CyberInsetPanel variant={moneyPowerTitle ? "toxic" : "cyan"}>
              <p className="text-base leading-relaxed text-zinc-100/90 sm:text-lg">{paragraphs[0]}</p>
            </CyberInsetPanel>
            <CyberInsetPanel variant={moneyPowerTitle ? "void" : "violet"} plasmaBar={moneyPowerTitle}>
              <p className="text-base leading-relaxed text-zinc-100/90 sm:text-lg">{paragraphs[1]}</p>
            </CyberInsetPanel>
          </div>

          {footerEmphasis ? (
            <p className="mt-5 font-mono text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100/90 sm:text-base">
              {footerEmphasis}
            </p>
          ) : null}

          <div className="mt-6">
            <MethodCtaButtons />
          </div>
        </div>

        <div
          className={
            hasKey
              ? "method-split-card__media method-split-card__media--key-only relative min-h-[14rem] overflow-hidden rounded-xl border border-amber-400/25 bg-[#04060d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(251,191,36,0.15)] lg:min-h-[100%]"
              : "method-split-card__media relative min-h-[14rem] overflow-hidden rounded-xl border border-white/15 bg-black/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_0_28px_rgba(34,211,238,0.12)] lg:min-h-[100%]"
          }
        >
          {hasVideo && videoSrc ? (
            <ViewportDecorVideo
              src={videoSrc}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : hasImage ? (
            <Image src={image!} alt={imageAlt} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover object-center" />
          ) : null}
          {!hasKey ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/55 via-black/15 to-transparent" aria-hidden />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_50%,rgba(251,191,36,0.1),transparent_72%)]"
              aria-hidden
            />
          )}
          {hasKey ? (
            <div className="absolute inset-0 z-[2] flex items-center justify-center p-4">
              <Image
                src={keySrc!}
                alt={imageAlt || "Gold key symbol"}
                width={560}
                height={760}
                className="max-h-full w-auto max-w-full object-contain object-center drop-shadow-[0_0_24px_rgba(251,191,36,0.5)]"
              />
            </div>
          ) : null}
        </div>
      </div>
    </CyberChamferFrame>
  );
}
