'use client'

import Image from 'next/image'
import Link from 'next/link'
import { NavApp } from '@/components/NavApp'
import { ViewportDecorVideo } from '@/components/ViewportDecorVideo'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import SiteFooter from '@/components/SiteFooter'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import { cx, CyberChamferFrame, CyberInsetPanel, type CyberFrameAccent } from '@/components/cyber/CyberChamferFrames'

const FEATURED_LOGOS = [
  {
    src: '/assets/press-forbes.png',
    alt: 'Forbes logo',
    href: 'https://forbes.ge/en/how-the-syndicate-uses-mastery-and-empowerment-to-redefine-business/',
  },
  {
    src: '/assets/press-luxury.png',
    alt: 'LLM logo',
    href: 'https://www.luxurylifestylemag.co.uk/money/how-the-syndicate-empowers-individuals-to-master-power-money-and-influence-in-the-money-mastery-course/',
  },
  {
    src: '/assets/press-gq.png',
    alt: 'GQ logo',
    href: 'https://gq.co.za/wealth/2025-02-10-how-the-syndicate-can-disrupt-the-traditional-model-of-influence-and-education-in-the-digital-age/',
  },
]

const ACCESS_PILLARS: {
  accent: CyberFrameAccent
  kicker: string
  title: string
  body: string
}[] = [
  {
    accent: 'cyan',
    kicker: 'Alliance channel',
    title: 'Power beside power',
    body:
      'You do not enter a crowd — you enter a sealed alliance of operators who move under honour, leverage, and execution. The Syndicate is built for those who refuse noise, nostalgia, and public performance as a substitute for results.',
  },
  {
    accent: 'violet',
    kicker: 'Crucible',
    title: 'Pressure-forged clarity',
    body:
      'Inside the network, friction is a feature: your blind spots get named, your standards get raised, and your strategy is stress-tested by people who have already paid tuition in the real economy. Growth here is not comfort — it is calibration.',
  },
  {
    accent: 'amber',
    kicker: 'Code',
    title: 'Non-negotiable integrity',
    body:
      'The Syndicate runs on a moral spine, not slogans. Mutual respect, discretion, and alliance-first conduct are not “culture slides” — they are the perimeter that keeps the vault rare, dangerous in the right hands, and useless to tourists.',
  },
]

const ROYAL_PATH_ITEMS = [
  {
    step: '01',
    tag: 'Doctrine',
    line: 'Legends are not handed down as bedtime stories — they are weaponised into doctrine: judgement, timing, nerve.',
    border: 'border-rose-400/75',
    glow: 'shadow-[0_0_0_1px_rgba(244,63,94,0.7),0_0_18px_rgba(244,63,94,0.45),0_0_32px_rgba(190,24,93,0.22)]',
    panel: 'bg-[linear-gradient(128deg,rgba(136,19,55,0.55)_0%,rgba(24,8,18,0.94)_48%,rgba(8,6,14,0.98)_100%)]',
    stepClass: 'border-rose-400/70 bg-rose-950/60 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.35)]',
    tagClass: 'text-rose-300/90',
    lineClass: 'text-rose-50/95',
  },
  {
    step: '02',
    tag: 'Through-line',
    line: 'From throne rooms to war rooms, the through-line is the same: read incentives, hold the line, strike with precision.',
    border: 'border-fuchsia-400/75',
    glow: 'shadow-[0_0_0_1px_rgba(217,70,239,0.7),0_0_18px_rgba(217,70,239,0.45),0_0_32px_rgba(162,28,175,0.22)]',
    panel: 'bg-[linear-gradient(128deg,rgba(126,34,206,0.5)_0%,rgba(18,8,28,0.94)_48%,rgba(8,6,14,0.98)_100%)]',
    stepClass: 'border-fuchsia-400/70 bg-fuchsia-950/60 text-fuchsia-100 shadow-[0_0_14px_rgba(217,70,239,0.35)]',
    tagClass: 'text-fuchsia-300/90',
    lineClass: 'text-fuchsia-50/95',
  },
  {
    step: '03',
    tag: 'Markets',
    line: 'The Syndicate reframes that lineage for modern markets: capital, attention, regulation, and reputation as interconnected battlefields.',
    border: 'border-cyan-400/75',
    glow: 'shadow-[0_0_0_1px_rgba(34,211,238,0.7),0_0_18px_rgba(34,211,238,0.45),0_0_32px_rgba(14,165,233,0.22)]',
    panel: 'bg-[linear-gradient(128deg,rgba(14,116,144,0.5)_0%,rgba(6,16,24,0.94)_48%,rgba(8,6,14,0.98)_100%)]',
    stepClass: 'border-cyan-400/70 bg-cyan-950/60 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.35)]',
    tagClass: 'text-cyan-300/90',
    lineClass: 'text-cyan-50/95',
  },
  {
    step: '04',
    tag: 'Power study',
    line: 'You study power to dismantle fantasy — not to cosplay a villain, but to command outcomes without losing your spine.',
    border: 'border-amber-400/75',
    glow: 'shadow-[0_0_0_1px_rgba(251,191,36,0.7),0_0_18px_rgba(251,191,36,0.45),0_0_32px_rgba(234,88,12,0.22)]',
    panel: 'bg-[linear-gradient(128deg,rgba(180,83,9,0.45)_0%,rgba(20,14,6,0.94)_48%,rgba(8,6,14,0.98)_100%)]',
    stepClass: 'border-amber-400/70 bg-amber-950/60 text-amber-100 shadow-[0_0_14px_rgba(251,191,36,0.35)]',
    tagClass: 'text-amber-300/90',
    lineClass: 'text-amber-50/95',
  },
  {
    step: '05',
    tag: 'Sovereignty',
    line: 'Greatness here is not vanity metrics. It is sovereignty: systems that work when you are not watching, and alliances that hold when pressure spikes.',
    border: 'border-emerald-400/75',
    glow: 'shadow-[0_0_0_1px_rgba(52,211,153,0.7),0_0_18px_rgba(52,211,153,0.45),0_0_32px_rgba(16,185,129,0.22)]',
    panel: 'bg-[linear-gradient(128deg,rgba(6,95,70,0.5)_0%,rgba(6,18,14,0.94)_48%,rgba(8,6,14,0.98)_100%)]',
    stepClass: 'border-emerald-400/70 bg-emerald-950/60 text-emerald-100 shadow-[0_0_14px_rgba(52,211,153,0.35)]',
    tagClass: 'text-emerald-300/90',
    lineClass: 'text-emerald-50/95',
  },
] as const

const pillarTitleClass: Record<CyberFrameAccent, string> = {
  cyan: 'text-cyan-100 drop-shadow-[0_0_14px_rgba(34,211,238,0.35)]',
  violet: 'text-fuchsia-100/95 drop-shadow-[0_0_14px_rgba(232,121,249,0.32)]',
  amber: 'text-amber-100 drop-shadow-[0_0_14px_rgba(251,191,36,0.28)]',
  hero: 'text-cyan-100',
  video: 'text-sky-100',
  separator: 'text-amber-100',
}

export default function WhatYouGetPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black">
      <NavApp />

      <main className="relative z-10">
        {/* Hero — unchanged structure vs. prior What You Get */}
        <section className="relative min-h-[112svh] w-full px-4 pb-14 pt-[116px] sm:px-6 sm:pb-20 sm:pt-[130px]">
          <ViewportDecorVideo
            src="/assets/bg-video.mp4"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="pointer-events-none absolute left-1/2 top-[clamp(96px,11vw,136px)] z-20 w-full -translate-x-1/2 px-4 max-sm:top-[92px]">
            <div className="mx-auto flex w-full max-w-[920px] justify-center">
              <NeonTypingBadge
                phrases={['HONOUR · MONEY · POWER · FREEDOM']}
                typingSpeed={70}
                deletingSpeed={48}
                pauseMs={900}
                boxed={false}
                className="footer-typing mx-auto w-full max-w-[min(92vw,720px)]"
              />
            </div>
          </div>
          <div className="mx-auto w-full max-w-[min(1650px,96vw)]">
            <div className="pt-16 sm:pt-20">
              <h1 className="hamburger-attract mt-4 text-6xl font-black leading-[0.98] text-zinc-100 sm:text-7xl md:text-8xl lg:text-[6.8rem]">
                Access to a powerful
                <br />
                network
                <br />
                and alliance.
              </h1>
            </div>
          </div>
        </section>

        {/* Body: membership / our-methods ambient + cyber frames */}
        <div className="relative bg-[#04060c]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-12%] top-[8%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/16 blur-[120px] sm:h-[480px] sm:w-[480px]" />
            <div className="absolute right-[-8%] top-[28%] h-[280px] w-[280px] rounded-full bg-[rgba(212,175,57,0.14)] blur-[110px] sm:h-[420px] sm:w-[420px]" />
            <div className="absolute bottom-[0%] left-1/2 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-[130px] sm:h-[520px] sm:w-[520px]" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(212,175,57,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.08) 1px, transparent 1px)',
                backgroundSize: '64px 64px, 64px 64px',
              }}
            />
            <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.16)_1px,transparent_1px),linear-gradient(rgba(167,139,250,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.12)_1px,transparent_1px)] [background-size:74px_74px,74px_74px,18px_18px,18px_18px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/80 via-[#05040c]/92 to-[#020208]/96" />
          </div>

          <div className="relative z-[1]">
            <section className="px-[clamp(1rem,3vw,2.2rem)] pb-10 pt-8 sm:pb-14 sm:pt-10">
              <div className="mx-auto max-w-[96rem]">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200/85">What you access //</p>
                <h2 className="mt-2 text-[clamp(1.75rem,4vw,3rem)] font-black uppercase tracking-[0.08em] text-zinc-50 drop-shadow-[0_0_24px_rgba(34,211,238,0.2)]">
                  The perimeter is sealed. The inside is lethal on purpose.
                </h2>
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {ACCESS_PILLARS.map((p) => (
                    <CyberChamferFrame
                      key={p.title}
                      accent={p.accent}
                      chamfer={18}
                      decorSize="compact"
                      className="h-full"
                      innerClassName="p-5 sm:p-6"
                    >
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400 sm:text-[11px]">
                        {p.kicker}
                      </p>
                      <h3 className={cx('mt-3 text-xl font-black uppercase tracking-[0.06em] sm:text-2xl', pillarTitleClass[p.accent])}>
                        {p.title}
                      </h3>
                      <p className="mt-4 text-sm leading-relaxed text-zinc-100/88 sm:text-base">{p.body}</p>
                    </CyberChamferFrame>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-[clamp(1rem,3vw,2.2rem)] pb-10 sm:pb-14">
              <div className="mx-auto max-w-[96rem]">
                <div className="mb-6">
                  <CyberChamferFrame accent="separator" chamfer={14} decorSize="compact" innerClassName="py-2.5 px-3">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-amber-200/90">Vault doctrine //</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/75">Money · Power · Signal</span>
                    </div>
                  </CyberChamferFrame>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_260px]">
                  <CyberChamferFrame accent="violet" chamfer={22} className="min-h-0" innerClassName="p-6 sm:p-8">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300/85 sm:text-[11px]">
                      Sovereign systems
                    </p>
                    <h2 className="mt-3 max-w-[22ch] text-balance text-[clamp(1.85rem,3.6vw,3.1rem)] font-black uppercase leading-[0.98] tracking-[0.05em] text-zinc-50 [text-shadow:0_0_18px_rgba(251,113,133,0.55),0_0_42px_rgba(168,85,247,0.28)]">
                      Influence without rot
                    </h2>
                    <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-100/88 sm:text-xl">
                      Capital and leverage are neutral until a human aims them. The Syndicate trains you to read power as infrastructure — not as a costume — so you can build, defend, and scale without surrendering your spine to the machine.
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <CyberInsetPanel variant="blood">
                        <p className="text-base leading-relaxed text-zinc-100/90 sm:text-lg">
                          Markets reward clarity and punish delusion. You learn to map incentives, chokepoints, and second-order effects — then move with restraint that reads as strength.
                        </p>
                      </CyberInsetPanel>
                      <CyberInsetPanel variant="void" plasmaBar>
                        <p className="text-base leading-relaxed text-zinc-100/90 sm:text-lg">
                          Membership layers unlock the dashboard, drops, and Syndicate Mode — the arena where discipline becomes data, and data becomes reputation you can cash.
                        </p>
                      </CyberInsetPanel>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link href="/our-methods" prefetch className="cta-nav-button text-sm font-semibold">
                        Our Methods
                      </Link>
                      <Link href="/membership" prefetch className="cta-nav-button text-sm font-semibold">
                        Membership
                      </Link>
                    </div>
                  </CyberChamferFrame>

                  <CyberChamferFrame accent="video" chamfer={18} decorSize="compact" className="mx-auto w-full max-w-[240px] lg:mx-0 lg:max-w-none" innerClassName="p-2">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src="/assets/Gold-Key.png"
                        alt="Syndicate vault key"
                        fill
                        sizes="(max-width: 1024px) 240px, 280px"
                        className="object-contain object-center p-4 what-you-get-key-float"
                        priority={false}
                      />
                    </div>
                  </CyberChamferFrame>
                </div>
              </div>
            </section>

            <section className="px-[clamp(1rem,3vw,2.2rem)] pb-12 sm:pb-16">
              <div className="mx-auto max-w-[96rem]">
                <CyberChamferFrame accent="hero" chamfer={20} innerClassName="p-6 sm:p-10">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <h2 className="text-[clamp(1.65rem,3.8vw,2.75rem)] font-black uppercase tracking-[0.06em] text-cyan-100 drop-shadow-[0_0_18px_rgba(34,211,238,0.35)]">
                      Lineage, re-armed
                    </h2>
                    <p className="max-w-md text-right text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/75 sm:text-sm">
                      Kings · emperors · operators
                    </p>
                  </div>
                  <div className="mt-6 grid gap-4 sm:gap-5">
                    {ROYAL_PATH_ITEMS.map((item, idx) => (
                      <article
                        key={item.step}
                        className={cx(
                          'what-you-get-stagger-row group relative overflow-hidden rounded-2xl border-2 p-4 transition-transform duration-300 hover:-translate-y-0.5 sm:p-5',
                          item.border,
                          item.glow,
                          item.panel
                        )}
                        style={{ animationDelay: `${idx * 0.12}s` }}
                      >
                        <span
                          className="pointer-events-none absolute inset-[5px] rounded-[14px] border border-white/10 opacity-80"
                          aria-hidden
                        />
                        <span
                          className="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-white/25"
                          aria-hidden
                        />
                        <span
                          className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-white/25"
                          aria-hidden
                        />
                        <div className="relative z-[1] grid gap-4 sm:grid-cols-[minmax(5.5rem,auto)_1fr] sm:items-start sm:gap-5">
                          <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                            <span
                              className={cx(
                                'inline-flex min-w-[3.25rem] items-center justify-center rounded-lg border-2 px-3 py-1.5 font-mono text-sm font-black tracking-[0.2em]',
                                item.stepClass
                              )}
                            >
                              {item.step}
                            </span>
                            <span
                              className={cx(
                                'font-mono text-[10px] font-bold uppercase tracking-[0.28em] sm:text-[11px]',
                                item.tagClass
                              )}
                            >
                              {item.tag}
                            </span>
                          </div>
                          <p className={cx('text-base leading-relaxed sm:text-lg', item.lineClass)}>{item.line}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="mx-auto mt-8 flex w-full max-w-[320px] justify-center sm:mt-10 sm:max-w-[360px]">
                    <Image
                      src="/assets/coin-gold.png"
                      alt="Syndicate seal"
                      width={360}
                      height={360}
                      className="coin-wheel-lr h-auto w-full object-contain"
                    />
                  </div>
                </CyberChamferFrame>
              </div>
            </section>

            <section className="px-[clamp(1rem,3vw,2.2rem)] pb-14 sm:pb-20">
              <div className="mx-auto max-w-[96rem]">
                <CyberChamferFrame accent="cyan" chamfer={16} decorSize="compact" innerClassName="p-6 text-center sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Next move</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-4">
                    <Link href="/membership" prefetch className="cta-nav-button text-sm font-semibold">
                      Enter membership
                    </Link>
                    <Link href="/programs" prefetch className="cta-nav-button text-sm font-semibold">
                      View programs
                    </Link>
                    <Link href="/quiz" prefetch className="cta-nav-button text-sm font-semibold">
                      Syn diagnosis
                    </Link>
                  </div>
                </CyberChamferFrame>
              </div>
            </section>
          </div>
        </div>
      </main>

      <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={40} />
      <SiteFooter sloganTypingSpeed={42} sloganDeletingSpeed={32} sloganPauseMs={900} />
      <style jsx>{`
        .what-you-get-stagger-row {
          opacity: 0;
          animation: rowReveal 0.55s ease-out forwards;
        }
        @keyframes rowReveal {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .coin-wheel-lr {
          animation: coinWheelSpin 5.2s linear infinite;
          transform-origin: center;
        }
        @keyframes coinWheelSpin {
          0% {
            transform: rotate(0deg) translateY(0px);
          }
          50% {
            transform: rotate(180deg) translateY(-6px);
          }
          100% {
            transform: rotate(360deg) translateY(0px);
          }
        }
        .what-you-get-key-float {
          animation: whatYouGetKeyOrbitLocal 6.8s linear infinite;
          transform-origin: center;
        }
        @keyframes whatYouGetKeyOrbitLocal {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          25% {
            transform: translate(8px, -6px) rotate(90deg);
          }
          50% {
            transform: translate(0px, -10px) rotate(180deg);
          }
          75% {
            transform: translate(-8px, -6px) rotate(270deg);
          }
        }
      `}</style>
    </div>
  )
}
