import Image from "next/image";
import type { ReactNode } from "react";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";
import { OFFER_PLAN_THUMB_THE_KNIGHT } from "@/components/programs/offerPlanThumbnails";

const HERO_INTRO =
  "The Knight is The Syndicate membership airlock — pick your courses, run Syndicate Mode, and work the member library. Money Mastery stays the lifetime vault. This is operator access, not a university login.";

/** Server-rendered hero shell — stable grid + reserved image slot (no hydration layout jump). */
export function MembershipKnightHero({ children }: { children: ReactNode }) {
  return (
    <section className="membership-knight-hero w-full min-w-0">
      <CyberChamferFrame accent="hero" chamfer={24} className="min-h-0" innerClassName="cyber-frame-mobile-pad p-7 sm:p-10 lg:p-14">
        <div className="membership-knight-hero-grid">
          <div className="membership-knight-hero-copy min-w-0">
            <h1
              className={`${publicHeadingLightning("amber")} marketing-card-title-oneline text-[clamp(2.2rem,5.4vw,5rem)] font-black uppercase leading-[0.9] tracking-[0.1em]`}
            >
              Enter The Knight Tier
            </h1>
            <p className="mt-5 max-w-2xl font-mono text-base leading-relaxed text-zinc-100/85 sm:text-lg">{HERO_INTRO}</p>
            {children}
          </div>
          <div className="membership-knight-hero-visual">
            <span
              className="pointer-events-none absolute left-1/2 top-[42%] z-0 h-[72%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.55)_0%,rgba(168,85,247,0.38)_38%,rgba(251,191,36,0.12)_62%,transparent_78%)] blur-[42px] sm:blur-[52px]"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute left-1/2 top-[48%] z-0 h-[55%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(232,121,249,0.45)_0%,rgba(34,211,238,0.28)_45%,transparent_72%)] blur-[28px]"
              aria-hidden
            />
            <CyberChamferFrame accent="video" chamfer={18} decorSize="compact" className="relative z-[1]" innerClassName="p-2">
              <div className="membership-knight-hero-visual-frame">
                <span
                  className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_38%,rgba(56,189,248,0.22),rgba(168,85,247,0.14)_48%,transparent_72%)]"
                  aria-hidden
                />
                <Image
                  src={OFFER_PLAN_THUMB_THE_KNIGHT}
                  alt="The Knight membership tier"
                  width={800}
                  height={1000}
                  priority
                  sizes="(max-width: 1024px) min(100vw, 26rem), 36vw"
                  className="relative z-[1] h-full w-full object-cover object-[center_22%]"
                />
                <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
            </CyberChamferFrame>
          </div>
        </div>
      </CyberChamferFrame>
    </section>
  );
}
