import type { CSSProperties } from "react";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { GuaranteeFeaturedLogos } from "@/components/guarantee/GuaranteeFeaturedLogos";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

/** 32pt locked — rem-based Tailwind was crushed by html { font-size: 14–16px }. */
const TITLE_32PT: CSSProperties = {
  fontSize: "32pt",
  lineHeight: 1.45,
  letterSpacing: "0.06em",
};

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

const CARDS = [
  {
    title: "Founder's Audit",
    body: "A private call directly with our Founder to examine exactly what went wrong.",
    Icon: IconFounderAudit,
    accent: "amber" as const,
    iconClass: "text-amber-200",
    titleLightning: "amber" as const,
  },
  {
    title: "Full Refund or Replacement",
    body: "A 100% refund processed within 48 hours, OR a free replacement program of your choice.",
    Icon: IconRefund,
    accent: "cyan" as const,
    iconClass: "text-cyan-200",
    titleLightning: "cyan" as const,
  },
  {
    title: "No Hidden Cost, No Hidden Obligations",
    body: "",
    Icon: IconHandshake,
    accent: "violet" as const,
    iconClass: "text-violet-200",
    titleLightning: "violet" as const,
  },
] as const;

export function SyndicateGuaranteeContent() {
  return (
    <div className="w-full space-y-8 sm:space-y-10">
      <header className="text-center">
        <CyberChamferFrame accent="hero" chamfer={22} className="w-full" innerClassName="px-5 py-9 sm:px-10 sm:py-14">
          <div className="guarantee-page-title--hero-stack">
            <p
              className={`guarantee-page-title ${publicHeadingLightning("gold")} font-black uppercase`}
              style={TITLE_32PT}
            >
              The Syndicate
            </p>
            <h1
              className={`guarantee-page-title ${publicHeadingLightning("amber")} font-black uppercase`}
              style={TITLE_32PT}
            >
              Bulletproof
            </h1>
            <p
              className={`guarantee-page-title ${publicHeadingLightning("gold")} font-black uppercase`}
              style={TITLE_32PT}
            >
              Guarantee
            </p>
          </div>
          <p className="mx-auto mt-8 max-w-4xl text-lg font-medium leading-[1.75] text-zinc-50 sm:mt-10 sm:text-xl sm:leading-[1.8] md:text-2xl md:leading-[1.85]">
            Operator protection built into every purchase — founder review, full refund or replacement, zero hidden
            strings.
          </p>
        </CyberChamferFrame>
      </header>

      <GuaranteeFeaturedLogos />

      <section aria-label="Guarantee details" className="grid gap-6 sm:gap-7">
        {CARDS.map(({ title, body, Icon, accent, iconClass, titleLightning }) => (
          <CyberChamferFrame
            key={title}
            accent={accent}
            chamfer={18}
            className="w-full"
            innerClassName="px-6 py-8 text-center sm:px-10 sm:py-11"
          >
            <Icon className={`mx-auto h-24 w-24 sm:h-28 sm:w-28 ${iconClass}`} />
            <h2
              className={`guarantee-page-title ${publicHeadingLightning(titleLightning)} mt-6 font-black uppercase sm:mt-7`}
              style={TITLE_32PT}
            >
              {title}
            </h2>
            {body ? (
              <p className="mx-auto mt-5 max-w-4xl text-lg font-medium leading-[1.75] text-zinc-50 sm:mt-6 sm:text-xl sm:leading-[1.8] md:text-[1.4rem] md:leading-[1.85]">
                {body}
              </p>
            ) : null}
          </CyberChamferFrame>
        ))}
      </section>
    </div>
  );
}
