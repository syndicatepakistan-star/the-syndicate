'use client'

import Image from 'next/image'
import Link from 'next/link'
import { NavApp } from '@/components/NavApp'
import { ViewportDecorVideo } from '@/components/ViewportDecorVideo'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import SiteFooter from '@/components/SiteFooter'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import { cx, CyberChamferFrame, CyberInsetPanel, type CyberFrameAccent } from '@/components/cyber/CyberChamferFrames'
import { publicHeadingLightning } from '@/lib/publicHeadingLightning'
import { WhatYouGetDoctrineSections } from '@/components/what-you-get/WhatYouGetDoctrineSections'
import {
  ACCESS_PILLARS,
  ALLIANCE_HERO_LEDE,
  ALLIANCE_SECTION_HEADLINE,
  ROYAL_PATH_ITEMS,
  ROYAL_PATH_TITLE,
} from '@/lib/whatYouGetCopy'

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

const pillarTitleClass: Record<CyberFrameAccent, string> = {
  cyan: 'text-cyan-100 drop-shadow-[0_0_14px_rgba(34,211,238,0.35)]',
  violet: 'text-fuchsia-100/95 drop-shadow-[0_0_14px_rgba(232,121,249,0.32)]',
  amber: 'text-amber-100 drop-shadow-[0_0_14px_rgba(251,191,36,0.28)]',
  hero: 'text-cyan-100',
  video: 'text-sky-100',
  separator: 'text-amber-100',
}

const NEXT_MOVE_CHAMFER =
  '[clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]'

const NEXT_MOVE_LINKS = [
  {
    label: 'Enter membership',
    href: '/membership',
    border: 'border-cyan-400/55',
    inset: 'border-cyan-300/22',
    corner: 'border-cyan-300/80',
    accent: 'bg-cyan-300/75 shadow-[0_0_8px_rgba(34,211,238,0.7)]',
    lightning: 'cyan' as const,
    glow: 'shadow-[0_0_24px_rgba(34,211,238,0.22)]',
    hoverBorder: 'hover:border-cyan-300/80',
    hoverGlow: 'hover:shadow-[0_0_36px_rgba(34,211,238,0.42)]',
    bg: 'bg-[linear-gradient(145deg,rgba(6,78,99,0.35)_0%,rgba(4,8,18,0.92)_100%)]',
  },
  {
    label: 'View programs',
    href: '/programs',
    border: 'border-fuchsia-400/55',
    inset: 'border-fuchsia-300/22',
    corner: 'border-fuchsia-300/80',
    accent: 'bg-fuchsia-300/75 shadow-[0_0_8px_rgba(217,70,239,0.7)]',
    lightning: 'fuchsia' as const,
    glow: 'shadow-[0_0_24px_rgba(217,70,239,0.22)]',
    hoverBorder: 'hover:border-fuchsia-300/80',
    hoverGlow: 'hover:shadow-[0_0_36px_rgba(217,70,239,0.42)]',
    bg: 'bg-[linear-gradient(145deg,rgba(112,26,117,0.35)_0%,rgba(8,4,16,0.92)_100%)]',
  },
  {
    label: 'Syn diagnosis',
    href: '/quiz',
    border: 'border-emerald-400/55',
    inset: 'border-emerald-300/22',
    corner: 'border-emerald-300/80',
    accent: 'bg-emerald-300/75 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    lightning: 'emerald' as const,
    glow: 'shadow-[0_0_24px_rgba(52,211,153,0.22)]',
    hoverBorder: 'hover:border-emerald-300/80',
    hoverGlow: 'hover:shadow-[0_0_36px_rgba(52,211,153,0.42)]',
    bg: 'bg-[linear-gradient(145deg,rgba(6,95,70,0.35)_0%,rgba(4,12,10,0.92)_100%)]',
  },
] as const

function WhatYouGetNextMovePanel({
  headingId,
  className,
}: {
  headingId: string
  className?: string
}) {
  return (
    <div className={cx('relative', className)}>
      <CyberChamferFrame accent="amber" chamfer={20} innerClassName="p-5 sm:p-6">
        <p
          id={headingId}
          className={`${publicHeadingLightning('amber')} font-mono text-xs font-bold uppercase tracking-[0.32em] sm:text-sm`}
        >
          Next move
        </p>
        <nav
          className="mx-auto mt-5 grid max-w-[34rem] gap-2.5 sm:max-w-[38rem] sm:grid-cols-3 sm:gap-3"
          aria-label="Next steps"
        >
          {NEXT_MOVE_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cx(
                'group relative flex min-h-[3.1rem] w-full items-center justify-center border-2 px-2.5 py-3 text-center font-black uppercase tracking-[0.08em] transition hover:-translate-y-0.5 hover:bg-black/70 sm:min-h-[3.35rem] sm:px-3 sm:py-3.5',
                NEXT_MOVE_CHAMFER,
                'text-[clamp(0.62rem,1.6vw,0.82rem)] sm:text-[clamp(0.68rem,1.1vw,0.88rem)]',
                item.border,
                item.glow,
                item.hoverBorder,
                item.hoverGlow,
                item.bg
              )}
            >
              <span
                aria-hidden
                className={cx(
                  'pointer-events-none absolute inset-[6px] border',
                  NEXT_MOVE_CHAMFER,
                  item.inset
                )}
              />
              <span
                aria-hidden
                className={cx('pointer-events-none absolute left-2.5 top-2.5 h-5 w-5 border-l-2 border-t-2', item.corner)}
              />
              <span
                aria-hidden
                className={cx(
                  'pointer-events-none absolute bottom-2.5 right-2.5 h-5 w-5 border-b-2 border-r-2',
                  item.corner
                )}
              />
              <span
                aria-hidden
                className={cx('pointer-events-none absolute left-3 top-2 h-[2px] w-5', item.accent)}
              />
              <span
                aria-hidden
                className={cx('pointer-events-none absolute bottom-2 right-3 h-4 w-[2px]', item.accent)}
              />
              <span
                className={cx(
                  publicHeadingLightning(item.lightning),
                  'relative z-[1] text-[clamp(0.62rem,1.6vw,0.82rem)] sm:text-[clamp(0.68rem,1.1vw,0.88rem)]'
                )}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </CyberChamferFrame>
    </div>
  )
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
            priority
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
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-100/88 sm:text-xl">
                {ALLIANCE_HERO_LEDE}
              </p>
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
                <h2
                  className={`${publicHeadingLightning('cyan')} text-[clamp(1.75rem,4vw,3rem)] font-black uppercase tracking-[0.08em]`}
                >
                  {ALLIANCE_SECTION_HEADLINE}
                </h2>
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:items-stretch">
                  {ACCESS_PILLARS.map((p) => (
                    <CyberChamferFrame
                      key={p.title}
                      accent={p.accent}
                      chamfer={18}
                      decorSize="compact"
                      flatPanel
                      className="h-full min-h-0 w-full min-w-0"
                      innerClassName="flex h-full min-h-0 flex-col p-5 sm:p-6"
                      contentClassName="flex min-h-0 flex-1 flex-col"
                    >
                      <h3
                        className={cx(
                          publicHeadingLightning('amber'),
                          'text-xl font-black uppercase tracking-[0.06em] sm:text-2xl',
                          pillarTitleClass[p.accent]
                        )}
                      >
                        {p.title}
                      </h3>
                      <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-100/88 sm:text-base">{p.body}</p>
                    </CyberChamferFrame>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-[clamp(1rem,3vw,2.2rem)] pb-10 sm:pb-14">
              <div className="mx-auto max-w-[96rem]">
                <div className="grid items-start gap-6 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_260px]">
                  <CyberChamferFrame accent="violet" chamfer={22} className="min-h-0" innerClassName="p-6 sm:p-8">
                    <h2
                      className={cx(
                        publicHeadingLightning('amber'),
                        'max-w-[22ch] text-balance text-[clamp(1.85rem,3.6vw,3.1rem)] font-black uppercase leading-[0.98] tracking-[0.05em] text-zinc-50 [text-shadow:0_0_18px_rgba(251,113,133,0.55),0_0_42px_rgba(168,85,247,0.28)]'
                      )}
                    >
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
                    <WhatYouGetNextMovePanel
                      headingId="what-you-get-next-move-influence-heading"
                      className="mt-8"
                    />
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

            <WhatYouGetDoctrineSections />

            <section className="px-[clamp(1rem,3vw,2.2rem)] pb-12 sm:pb-16">
              <div className="mx-auto max-w-[96rem]">
                <CyberChamferFrame accent="hero" chamfer={20} innerClassName="p-6 sm:p-10">
                  <h2
                    className={`${publicHeadingLightning('cyan')} text-[clamp(1.65rem,3.8vw,2.75rem)] font-black uppercase tracking-[0.06em]`}
                  >
                    {ROYAL_PATH_TITLE}
                  </h2>
                  <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,340px)] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] xl:gap-8">
                    <div className="grid min-w-0 gap-4 sm:gap-5">
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

                    <CyberChamferFrame
                      accent="cyan"
                      chamfer={18}
                      decorSize="compact"
                      className="mx-auto w-full max-w-[360px] sm:max-w-[400px] lg:mx-0 lg:h-full lg:max-w-none"
                      innerClassName="flex h-full min-h-[clamp(22rem,52vw,28rem)] flex-col p-2 sm:min-h-[clamp(26rem,48vw,32rem)] lg:min-h-full"
                      contentClassName="flex min-h-0 flex-1 flex-col"
                    >
                      <div className="relative min-h-[clamp(20rem,48vw,24rem)] w-full flex-1 overflow-hidden sm:min-h-[clamp(24rem,44vw,28rem)]">
                        <Image
                          src="/assets/lineage-re-armed.jpg"
                          alt="Lineage re-armed — Syndicate doctrine and modern power"
                          fill
                          sizes="(max-width: 1024px) 360px, 420px"
                          className="object-cover object-center"
                          priority={false}
                        />
                        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/55 via-transparent to-black/20" />
                      </div>
                    </CyberChamferFrame>
                  </div>
                </CyberChamferFrame>
              </div>
            </section>

          </div>
        </div>
      </main>

      <section
        aria-labelledby="what-you-get-next-move-heading"
        className="relative z-10 border-t border-amber-500/15 bg-[#04060c] px-[clamp(1rem,3vw,2.2rem)] py-10 sm:py-14"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[280px] w-[min(100%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-[min(100%,80rem)] items-center justify-center gap-2 px-1 sm:gap-4 lg:gap-6">
          <div
            className="relative mx-3 h-[7.25rem] w-[7.25rem] shrink-0 sm:mx-6 sm:h-40 sm:w-40 md:mx-8 md:h-44 md:w-44 lg:mx-10 lg:h-48 lg:w-48 xl:h-52 xl:w-52"
            aria-hidden
          >
            <div className="absolute inset-0">
              <Image
                src="/assets/coin-gold.png"
                alt=""
                fill
                sizes="(max-width: 640px) 116px, (max-width: 1024px) 176px, 208px"
                className="object-contain object-center coin-wheel-lr drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]"
              />
            </div>
          </div>
          <div className="min-w-0 w-full max-w-[46rem] flex-1">
            <WhatYouGetNextMovePanel headingId="what-you-get-next-move-heading" />
          </div>
          <div
            className="relative mx-3 h-[7.25rem] w-[7.25rem] shrink-0 sm:mx-6 sm:h-40 sm:w-40 md:mx-8 md:h-44 md:w-44 lg:mx-10 lg:h-48 lg:w-48 xl:h-52 xl:w-52"
            aria-hidden
          >
            <div className="absolute inset-0">
              <Image
                src="/assets/Gold-Key.png"
                alt=""
                fill
                sizes="(max-width: 640px) 116px, (max-width: 1024px) 176px, 208px"
                className="object-contain object-center what-you-get-key-float drop-shadow-[0_0_18px_rgba(251,191,36,0.35)]"
              />
            </div>
          </div>
        </div>
      </section>

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
        :global(.coin-wheel-lr) {
          animation: coinWheelSpin 5.2s linear infinite;
          transform-origin: center;
        }
        @keyframes coinWheelSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        :global(.what-you-get-key-float) {
          animation: whatYouGetKeyFloatLocal 3.8s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes whatYouGetKeyFloatLocal {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}
