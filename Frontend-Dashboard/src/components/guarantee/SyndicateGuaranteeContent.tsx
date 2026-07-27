import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

function IconFounderAudit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <circle cx="32" cy="20" r="9" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M18 54c2-13 10-19 14-19s12 6 14 19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M22 16c0-5 4-9 10-9s10 4 10 9v3H22v-3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M28 10h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 14h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconRefund({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <rect x="8" y="20" width="38" height="24" rx="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M14 30h26M14 36h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="46" cy="40" r="11" fill="#050505" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M46 33.5v13M42.2 36.8c1.1-1 2.3-1.5 3.8-1.5 2.4 0 3.8 1.1 3.8 2.8 0 1.6-1.3 2.5-3.5 2.9l-2 .4c-1.8.4-2.7 1-2.7 2.2 0 1.4 1.3 2.3 3.5 2.3 1.6 0 2.9-.5 3.9-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHandshake({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <rect x="16" y="8" width="32" height="42" rx="3" stroke="currentColor" strokeWidth="2.2" />
      <path d="M24 18h16M24 26h16M24 34h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M14 46c5-7 12-9 18-4 6-5 13-3 18 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M26 44c2.5 2.5 5 3.5 6 3.5s3.5-1 6-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const CHILD_CARDS: Array<{
  title: ReactNode;
  body: ReactNode;
  Icon: typeof IconFounderAudit;
  accent: "amber" | "cyan" | "violet";
  iconClass: string;
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
    Icon: IconFounderAudit,
    accent: "amber",
    iconClass: "text-amber-200",
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
    Icon: IconRefund,
    accent: "cyan",
    iconClass: "text-cyan-200",
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
    Icon: IconHandshake,
    accent: "violet",
    iconClass: "text-violet-200",
    titleLightning: "violet",
  },
];

/** Mobile/tablet portrait: keep emblem + cards on the same centered width (+10px). */
const GUARANTEE_MOBILE_COL =
  "mx-auto w-[min(58vw,calc(11.5rem+10px))] sm:w-[min(42vw,calc(15rem+10px))] md:w-full";

export function SyndicateGuaranteeContent() {
  return (
    <div className="guarantee-stack mx-auto flex w-full max-w-[96rem] flex-col gap-8 sm:gap-10 lg:gap-12">
      {/* Title */}
      <header className="text-center">
        <h1 className="guarantee-page-title guarantee-page-title--hero font-black uppercase tracking-[0.08em]">
          <span className={publicHeadingLightning("cyan")}>Syndicate</span>{" "}
          <span className={publicHeadingLightning("amber")}>Bulletproof</span>{" "}
          <span className={publicHeadingLightning("violet")}>Guarantee</span>
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
          {CHILD_CARDS.map(({ title, body, Icon, accent, iconClass, titleLightning }, index) => (
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
              <Icon className={`h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-11 md:w-11 ${iconClass}`} />
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
