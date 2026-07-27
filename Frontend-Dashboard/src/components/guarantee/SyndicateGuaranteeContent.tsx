import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const CHILD_CARDS: Array<{
  title: ReactNode;
  body: ReactNode;
  iconSrc: string;
  iconAlt: string;
  accent: "amber" | "cyan" | "violet";
  titleLightning: "amber" | "cyan" | "violet";
}> = [
  {
    title: (
      <>
        Founder&apos;s <span className="text-amber-100">Audit</span>
      </>
    ),
    body: (
      <>
        Private <span className="font-semibold text-amber-200">founder call</span> to review what went wrong.
      </>
    ),
    iconSrc: "/assets/guarantee/audit.png",
    iconAlt: "Founder's Audit",
    accent: "amber",
    titleLightning: "amber",
  },
  {
    title: (
      <>
        <span className="text-cyan-100">Refund</span> or Replace
      </>
    ),
    body: (
      <>
        <span className="font-semibold text-cyan-200">100% refund</span> in{" "}
        <span className="font-semibold text-cyan-200">48 hours</span>, or a free replacement program.
      </>
    ),
    iconSrc: "/assets/guarantee/replace_or_refund.png",
    iconAlt: "Refund or Replace",
    accent: "cyan",
    titleLightning: "cyan",
  },
  {
    title: (
      <>
        No <span className="text-violet-100">Hidden</span> Costs
      </>
    ),
    body: (
      <>
        No <span className="font-semibold text-violet-200">hidden fees</span>. No{" "}
        <span className="font-semibold text-violet-200">hidden obligations</span>.
      </>
    ),
    iconSrc: "/assets/guarantee/icon-no-hidden-costs.png",
    iconAlt: "No Hidden Costs",
    accent: "violet",
    titleLightning: "violet",
  },
];

/** Mobile/tablet portrait: keep emblem + cards on the same centered width (+10px). */
const GUARANTEE_MOBILE_COL =
  "mx-auto w-[min(58vw,calc(11.5rem+10px))] sm:w-[min(42vw,calc(15rem+10px))] md:w-full";

export function SyndicateGuaranteeContent() {
  return (
    <div className="guarantee-stack mx-auto flex w-full max-w-[96rem] flex-col gap-8 sm:gap-10 lg:gap-12">
      {/* Title — two centered rows */}
      <header className="text-center">
        <h1 className="guarantee-page-title guarantee-page-title--hero guarantee-page-title--hero-stack text-center font-black uppercase tracking-[0.08em]">
          <span className={publicHeadingLightning("cyan")}>Syndicate</span>
          <span className="text-center">
            <span className={publicHeadingLightning("amber")}>Bulletproof</span>{" "}
            <span className={publicHeadingLightning("violet")}>Guarantee</span>
          </span>
        </h1>
      </header>

      {/* Emblem + cards share one width column on mobile */}
      <div className={`guarantee-emblem-cards flex flex-col gap-5 sm:gap-6 md:gap-8 lg:gap-10 ${GUARANTEE_MOBILE_COL} md:max-w-none`}>
        <div className="mx-auto w-full md:w-[calc(16.5rem+10px)] lg:w-[calc(18rem+10px)]">
          <CyberChamferFrame accent="video" chamfer={14} decorSize="compact" className="w-full" innerClassName="p-1.5 sm:p-2">
            <div className="guarantee-refund-media relative aspect-square w-full overflow-hidden">
              <Image
                src="/assets/guarantee/syndicate-guarantee-refund.png"
                alt="Syndicate Guarantee Refund — secure digital protection emblem"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 640px) 194px, (max-width: 768px) 250px, (max-width: 1024px) 274px, 298px"
              />
            </div>
          </CyberChamferFrame>
        </div>

        <section
          aria-label="Guarantee details"
          className="grid w-full grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch md:gap-5"
        >
          {CHILD_CARDS.map(({ title, body, iconSrc, iconAlt, accent, titleLightning }, index) => (
            <CyberChamferFrame
              key={index}
              accent={accent}
              chamfer={18}
              decorSize="compact"
              flatPanel
              className="guarantee-square-card aspect-square h-auto w-full min-w-0"
              innerClassName="guarantee-square-card__pad flex h-full min-h-0 flex-col"
              contentClassName="flex min-h-0 flex-1 flex-col items-center justify-center text-center"
            >
              <span className="guarantee-card-icon relative block h-10 w-10 shrink-0 sm:h-11 sm:w-11 md:h-12 md:w-12">
                <Image
                  src={iconSrc}
                  alt={iconAlt}
                  fill
                  className="object-contain object-center"
                  sizes="48px"
                />
              </span>
              <h2
                className={`guarantee-page-title guarantee-page-title--card ${publicHeadingLightning(titleLightning)} mt-2 font-black uppercase tracking-[0.06em] sm:mt-2.5`}
              >
                {title}
              </h2>
              <p className="guarantee-page-card-body mt-2 font-medium leading-snug text-zinc-100/88 sm:mt-2.5">
                {body}
              </p>
            </CyberChamferFrame>
          ))}
        </section>

        <CyberChamferFrame
          accent="hero"
          chamfer={16}
          decorSize="compact"
          className="guarantee-square-card aspect-square w-full md:aspect-auto md:min-h-0"
          innerClassName="guarantee-square-card__pad flex h-full min-h-0 flex-col justify-center"
        >
          <div
            id="guarantee-apply"
            className="flex flex-col items-center justify-center gap-3 sm:gap-4 md:flex-row md:flex-wrap md:gap-6"
          >
            <p className="guarantee-page-apply-copy max-w-xl text-center text-zinc-300">
              Apply via <span className="font-semibold text-fuchsia-200">email OTP</span> — no login.{" "}
              <span className="font-semibold break-all text-cyan-200 sm:break-normal">
                intelligence@the-syndicate.com
              </span>
            </p>
            <Link
              href="/syndicate-guarantee/apply"
              className="hamburger-attract inline-flex min-h-[48px] w-full max-w-[240px] shrink-0 items-center justify-center rounded-lg border border-fuchsia-300/80 bg-black/80 px-8 py-2.5 text-base font-bold uppercase tracking-[0.08em] text-fuchsia-100 shadow-[0_0_18px_rgba(232,121,249,0.4)] transition hover:scale-[1.03] hover:bg-black/95 hover:shadow-[0_0_28px_rgba(232,121,249,0.6)] sm:w-auto sm:max-w-none"
            >
              Apply
            </Link>
          </div>
        </CyberChamferFrame>
      </div>
    </div>
  );
}
