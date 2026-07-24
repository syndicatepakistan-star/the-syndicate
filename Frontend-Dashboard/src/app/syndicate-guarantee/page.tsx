import type { Metadata } from "next";
import { NavApp } from "@/components/NavApp";
import GlobalBottomSections from "@/components/GlobalBottomSections";
import { SyndicateGuaranteeContent } from "@/components/guarantee/SyndicateGuaranteeContent";
import { GuaranteeApplyPanel } from "@/components/guarantee/GuaranteeApplyPanel";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Syndicate Guarantee — Bulletproof Refund Policy",
  description:
    "The Syndicate Bulletproof Guarantee: founder’s audit, full refund or replacement within 48 hours, and no hidden costs.",
  path: "/syndicate-guarantee",
});

export default function SyndicateGuaranteePage() {
  return (
    <div className="public-page-shell relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#04060c] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-10%] top-[8%] h-[280px] w-[280px] rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute right-[-12%] top-[18%] h-[300px] w-[300px] rounded-full bg-violet-500/16 blur-3xl" />
        <div className="absolute left-[36%] top-[58%] h-[320px] w-[320px] rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(34,211,238,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.18)_1px,transparent_1px),linear-gradient(rgba(167,139,250,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.12)_1px,transparent_1px)] [background-size:74px_74px,74px_74px,18px_18px,18px_18px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(56,189,248,0.1),transparent_58%),radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(167,139,250,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/74 via-[#05040c]/88 to-[#020208]/96" />
      </div>

      <NavApp />

      <main className="relative z-[2] mx-auto w-[85vw] max-w-[85vw] min-w-0 space-y-8 px-0 pb-[clamp(2.5rem,6vw,4rem)] pt-[clamp(5.5rem,14vw,7rem)] sm:space-y-10">
        <SyndicateGuaranteeContent />
        <GuaranteeApplyPanel />
      </main>

      <GlobalBottomSections />
    </div>
  );
}
