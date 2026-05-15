"use client";

import Image from "next/image";
import Link from "next/link";
import { NavApp } from "@/components/NavApp";
import SiteFooter from "@/components/SiteFooter";
import { CyberChamferFrame, CyberInsetPanel, cx } from "@/components/cyber/CyberChamferFrames";
import type { CyberFrameAccent } from "@/components/cyber/CyberChamferFrames";
import { AFFILIATE_LOGIN_HREF } from "@/lib/affiliateSession";

type ShowcaseAccent = Extract<CyberFrameAccent, "cyan" | "violet" | "amber">;

const SHOWCASE = [
  {
    src: "/assets/affiliate-page/01-affiliate-dashboard.png",
    accent: "cyan" as const satisfies ShowcaseAccent,
    kicker: "Live partner HUD",
    title: "Affiliate dashboard — revenue on glass",
    body: "Referral link, copy / share / withdraw, snapshot tiles, revenue-flow bars: one frame so you see clicks, leads, sales, conversion, and earnings without tab-hopping. This is the exact UI you run in the portal.",
  },
  {
    src: "/assets/affiliate-page/02-referrals-board.png",
    accent: "violet" as const satisfies ShowcaseAccent,
    kicker: "Referral war-room",
    title: "Referrals board — every dossier tagged",
    body: "Money and time filters, sort newest first, Syn Diagnosis vs sign-up leads, joined vs purchased, paid lines and your earning column in gold. The board is the receipt rack: who entered, what they bought, what you cleared.",
  },
  {
    src: "/assets/affiliate-page/03-referrals-feed.png",
    accent: "amber" as const satisfies ShowcaseAccent,
    kicker: "Lead feed + pages",
    title: "Paged lead feed — subscription + earning split",
    body: "Each row is a clipped dual-channel read: subscription activity on the violet rail, your earning on the amber rail, status chips, paid stamps, and pagination when the list deepens. Commission tiers stay visible in the footer strip.",
  },
  {
    src: "/assets/affiliate-page/04-conversion-formula.png",
    accent: "cyan" as const satisfies ShowcaseAccent,
    kicker: "Conversion vault",
    title: "Conversion formula — numbers on the table",
    body: "Open the vault modal: clicks, leads, sales, the blended formula, and the percentage result with no black-box scoring. Same neon chamfer language as the rest of the cockpit — know the math or do not touch the lever.",
  },
  {
    src: "/assets/affiliate-page/05-withdraw-airlock.png",
    accent: "violet" as const satisfies ShowcaseAccent,
    kicker: "Withdraw airlock",
    title: "Withdraw rails — bank fields under lock",
    body: "Threshold, current earnings state, multi-field bank capture with colour-coded chamfer inputs, amount cap to balance, submit under crimson glow. Payout window copy stays in-frame so you know when wire hits.",
  },
] as const;

export default function AffiliateMarketingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#04060c]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video className="absolute inset-0 h-full w-full object-cover opacity-25" autoPlay muted loop playsInline>
          <source src="/assets/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute left-[-10%] top-[8%] h-[400px] w-[400px] rounded-full bg-cyan-400/18 blur-[140px]" />
        <div className="absolute right-[-12%] top-[14%] h-[440px] w-[440px] rounded-full bg-violet-500/20 blur-[150px]" />
        <div className="absolute left-[36%] top-[54%] h-[500px] w-[500px] rounded-full bg-rose-500/10 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(34,211,238,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(rgba(167,139,250,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.14)_1px,transparent_1px)] [background-size:74px_74px,74px_74px,18px_18px,18px_18px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(56,189,248,0.1),transparent_58%),radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(244,63,94,0.11),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/74 via-[#05040c]/88 to-[#020208]/96" />
      </div>

      <NavApp />

      <span className="pointer-events-none fixed right-[max(0.65rem,env(safe-area-inset-right))] top-1/2 z-[55] -translate-y-1/2 sm:right-5">
        <Link
          href={AFFILIATE_LOGIN_HREF}
          prefetch
          className="cta-nav-button pointer-events-auto whitespace-nowrap text-xs font-semibold !min-h-0 !min-w-[44px] !px-2 !py-7 [text-orientation:mixed] [writing-mode:vertical-rl] sm:text-sm"
        >
          Affiliate login
        </Link>
      </span>

      <section className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-10 pt-[88px] sm:pb-12 sm:pt-[106px]">
        <div className="mx-auto max-w-[96rem]">
          <CyberChamferFrame
            accent="hero"
            chamfer={24}
            hideOuterRing
            className="min-h-[56vh]"
            innerClassName="p-7 sm:p-10 lg:p-12"
          >
            <div className="mx-auto max-w-[56rem] text-center">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200/85 sm:text-xs">
                Syndicate partner channel
              </p>
              <h1 className="font-heading programs-heading-glow mt-4 text-[clamp(2rem,5vw,3.6rem)] font-black uppercase leading-[0.95] tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_18px_rgba(34,211,238,0.52)]">
                Turn attention into withdrawals
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-zinc-100/88 sm:text-lg">
                Deploy a tracked Syndicate link. When your audience runs diagnosis, signs up, and buys, you earn on the
                chain that matters: clicks → leads → checkouts → commissions. Below is exactly what the partner cockpit
                looks like — no stock art, no alternate skins.
              </p>
            </div>
          </CyberChamferFrame>
        </div>
      </section>

      <div className="relative z-10 space-y-10 px-[clamp(1rem,3vw,2.2rem)] pb-14 sm:space-y-12 sm:pb-20">
        <div className="mx-auto max-w-[96rem] space-y-10 sm:space-y-12">
          {SHOWCASE.map((block, i) => (
            <CyberChamferFrame
              key={block.src}
              accent={block.accent}
              chamfer={22}
              className="mx-auto w-full"
              innerClassName="p-6 sm:p-8 lg:p-10"
            >
              <div
                className={cx(
                  "grid items-center gap-8 lg:gap-12",
                  "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]",
                  i % 2 === 1 && "lg:[direction:rtl]",
                )}
              >
                <div className={cx("space-y-4 text-left", i % 2 === 1 && "lg:[direction:ltr]")}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-200/85 sm:text-[11px]">
                    {block.kicker}
                  </p>
                  <h2 className="text-[clamp(1.65rem,3.2vw,2.35rem)] font-black uppercase leading-tight tracking-[0.08em] text-zinc-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)]">
                    {block.title}
                  </h2>
                  <CyberInsetPanel variant={block.accent === "amber" ? "amber" : block.accent === "violet" ? "violet" : "cyan"}>
                    <p className="text-base leading-relaxed text-zinc-100/92 sm:text-lg">{block.body}</p>
                  </CyberInsetPanel>
                </div>

                <div className={cx(i % 2 === 1 && "lg:[direction:ltr]")}>
                  <CyberChamferFrame accent="video" chamfer={16} decorSize="compact" innerClassName="p-2 sm:p-2.5">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#050510]">
                      <Image
                        src={block.src}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 96vw, 820px"
                        className="object-cover object-top"
                        priority={i === 0}
                      />
                    </div>
                  </CyberChamferFrame>
                </div>
              </div>
            </CyberChamferFrame>
          ))}
        </div>

        <div className="mx-auto max-w-[96rem]">
          <CyberChamferFrame accent="amber" chamfer={20} innerClassName="px-6 py-10 text-center sm:px-10 sm:py-12">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[0.12em] text-amber-100">
              Already cleared as a partner?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-100/88 sm:text-lg">
              Same email we have on file → one-time OTP → your live portal unlocks. Hit the button and stop leaving
              commissions on the table.
            </p>
            <div className="mt-8">
              <Link href={AFFILIATE_LOGIN_HREF} prefetch className="cta-nav-button text-sm font-semibold">
                Affiliate login
              </Link>
            </div>
          </CyberChamferFrame>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
