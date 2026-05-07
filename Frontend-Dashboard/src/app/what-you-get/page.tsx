'use client'

import Image from 'next/image'
import Link from 'next/link'
import { NavApp } from '@/components/NavApp'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import SiteFooter from '@/components/SiteFooter'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import { syndicateOtpLoginHref } from '@/lib/syndicate-otp-paths'

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

const NEON_CARD_STYLES = [
  'from-cyan-300 via-sky-500 to-fuchsia-500 shadow-[0_0_0_1px_rgba(56,236,255,0.98),0_0_18px_rgba(56,236,255,0.58),0_0_46px_rgba(56,236,255,0.34),inset_0_0_12px_rgba(56,236,255,0.28)]',
  'from-fuchsia-400 via-violet-500 to-cyan-400 shadow-[0_0_0_1px_rgba(232,121,249,0.98),0_0_18px_rgba(232,121,249,0.58),0_0_46px_rgba(232,121,249,0.34),inset_0_0_12px_rgba(232,121,249,0.28)]',
  'from-indigo-400 via-purple-500 to-cyan-300 shadow-[0_0_0_1px_rgba(129,140,248,0.98),0_0_18px_rgba(129,140,248,0.58),0_0_46px_rgba(129,140,248,0.34),inset_0_0_12px_rgba(129,140,248,0.28)]',
]

export default function WhatYouGetPage() {
  const loginHref = syndicateOtpLoginHref()

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#020205]">
      <NavApp />

      <main className="relative z-10">
        <section className="relative min-h-[112svh] w-full px-4 pb-14 pt-[116px] sm:px-6 sm:pb-20 sm:pt-[130px]">
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/assets/bg-video.mp4" type="video/mp4" />
          </video>
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

        <section className="px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto grid w-full max-w-[min(1650px,96vw)] gap-6 md:grid-cols-3">
            {[
              'Joining a powerful alliance, an elite organisation of like-minded individuals, becomes not just a choice but a necessity for those who seek to transcend the difficult struggles for power and possession.',
              'Within the sanctity of this alliance, you not only find refuge but a crucible for growth, where your strengths are honed and your weaknesses fortified by the collective wisdom of those who share your values and desires.',
              'This is not merely a network, it is an alliance forged on a sacred moral code. Its members abide by principles of integrity, mutual respect, and unwavering honour.',
            ].map((item, idx) => (
              <div
                key={item}
                className={`group relative h-full overflow-visible bg-[#05080f] p-[5px] [clip-path:polygon(0_16px,16px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-16px),calc(100%-16px)_100%,24px_100%,0_calc(100%-24px))] ${
                  idx === 0
                    ? "shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_18px_rgba(34,211,238,0.28)] before:bg-[linear-gradient(102deg,rgba(34,211,238,0.96)_0%,rgba(34,211,238,0.58)_42%,rgba(21,24,35,0)_80%)] after:border-cyan-300/55 after:shadow-[0_0_0_1px_rgba(34,211,238,0.32)_inset,0_0_14px_rgba(34,211,238,0.34),0_0_28px_rgba(34,211,238,0.22)] hover:after:border-cyan-200/80 hover:after:shadow-[0_0_0_1px_rgba(34,211,238,0.5)_inset,0_0_20px_rgba(34,211,238,0.44),0_0_38px_rgba(34,211,238,0.3)]"
                    : idx === 1
                      ? "shadow-[0_0_0_1px_rgba(232,121,249,0.45),0_0_18px_rgba(232,121,249,0.28)] before:bg-[linear-gradient(102deg,rgba(232,121,249,0.96)_0%,rgba(232,121,249,0.58)_42%,rgba(21,24,35,0)_80%)] after:border-fuchsia-300/55 after:shadow-[0_0_0_1px_rgba(232,121,249,0.32)_inset,0_0_14px_rgba(232,121,249,0.34),0_0_28px_rgba(232,121,249,0.22)] hover:after:border-fuchsia-200/80 hover:after:shadow-[0_0_0_1px_rgba(232,121,249,0.5)_inset,0_0_20px_rgba(232,121,249,0.44),0_0_38px_rgba(232,121,249,0.3)]"
                      : "shadow-[0_0_0_1px_rgba(250,204,21,0.45),0_0_18px_rgba(250,204,21,0.24)] before:bg-[linear-gradient(102deg,rgba(250,204,21,0.95)_0%,rgba(250,204,21,0.56)_42%,rgba(21,24,35,0)_80%)] after:border-amber-300/55 after:shadow-[0_0_0_1px_rgba(250,204,21,0.34)_inset,0_0_14px_rgba(250,204,21,0.3),0_0_28px_rgba(250,204,21,0.2)] hover:after:border-amber-200/80 hover:after:shadow-[0_0_0_1px_rgba(250,204,21,0.52)_inset,0_0_20px_rgba(250,204,21,0.4),0_0_38px_rgba(250,204,21,0.28)]"
                } before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:[clip-path:polygon(0_16px,16px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-16px),calc(100%-16px)_100%,24px_100%,0_calc(100%-24px))] before:opacity-95 before:transition-all before:duration-200 before:ease-out after:pointer-events-none after:absolute after:inset-[-2px] after:content-[''] after:[clip-path:polygon(0_18px,18px_0,calc(100%-28px)_0,100%_28px,100%_calc(100%-18px),calc(100%-18px)_100%,28px_100%,0_calc(100%-28px))] after:border after:transition-all after:duration-200 after:ease-out hover:before:opacity-100 hover:before:brightness-110 hover:after:translate-x-[1px] hover:after:-translate-y-[1px]`}
              >
                <div className="relative h-full bg-[#120F17] p-7 text-lg leading-relaxed text-zinc-100/94 [clip-path:polygon(0_16px,16px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-16px),calc(100%-16px)_100%,24px_100%,0_calc(100%-24px))] sm:p-8 sm:text-xl">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto w-full max-w-[min(1650px,96vw)]">
            <h2 className="text-4xl font-black uppercase tracking-[0.04em] text-white sm:text-6xl">
              Money and Power Mastery
            </h2>
            <div className="mx-auto mt-7 grid w-full max-w-[min(1480px,94vw)] gap-7 lg:grid-cols-[0.95fr_0.95fr_0.65fr]">
              {[
                'The Syndicate philosophy teaches that money and power go hand in hand. They are like two sides of the same coin. Money and power, if not correctly wielded, has the potential to completely corrupt you, leading you down a dark path of corrupt, degenerate and hedonistic behaviour.',
                'The Syndicate&apos;s mission goes beyond attaining money, power and influence. Its elite training programmes aim to redefine how individuals perceive power and influence, emphasising the importance of moral strength and societal impact.',
              ].map((text) => (
                <div
                  key={text}
                  className="group relative h-full min-h-[330px] overflow-hidden bg-[#131727] p-[5px] [clip-path:polygon(0_14px,14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_14px)] shadow-[0_0_0_1px_rgba(248,113,113,0.35),0_0_16px_rgba(248,113,113,0.2)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:[clip-path:polygon(0_14px,14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_14px)] before:bg-[linear-gradient(98deg,rgba(248,113,113,0.95)_0%,rgba(251,113,133,0.78)_36%,rgba(79,70,229,0.4)_100%)] before:opacity-95 after:pointer-events-none after:absolute after:inset-[6px] after:content-[''] after:[clip-path:polygon(0_12px,12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_12px)] after:border after:border-rose-300/40 after:shadow-[0_0_0_1px_rgba(248,113,113,0.34)_inset] hover:before:brightness-110"
                >
                  <span className="pointer-events-none absolute left-[10px] top-[10px] z-[2] h-3 w-3 rounded-full bg-rose-500/95 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                  <span className="pointer-events-none absolute bottom-[10px] right-[10px] z-[2] h-3 w-3 rounded-full bg-rose-500/95 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                  <div className="relative z-[1] h-full bg-[#141726]/94 p-8 text-xl leading-relaxed text-zinc-100/94 [clip-path:polygon(0_12px,12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_12px)] sm:p-10 sm:text-[1.72rem]">
                    {text}
                  </div>
                </div>
              ))}
              <div className="group relative min-h-[280px] sm:min-h-[330px] overflow-hidden bg-gradient-to-br from-cyan-300 via-sky-500 to-fuchsia-500 p-[5px] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]">
                <div className="relative h-full overflow-hidden bg-[#020205]/92 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]">
                  <Image
                    src="/assets/Gold-Key.png"
                    alt="Syndicate gold key"
                    fill
                    sizes="(max-width: 1024px) 92vw, 24vw"
                    className="what-you-get-key-float object-contain p-8 sm:p-6 transition duration-500 group-hover:scale-[1.05]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 sm:py-14">
          <div className="group relative mx-auto w-full max-w-[min(1650px,96vw)] overflow-visible bg-[#05080f] p-[5px] [clip-path:polygon(0_16px,16px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-16px),calc(100%-16px)_100%,24px_100%,0_calc(100%-24px))] shadow-[0_0_0_1px_rgba(94,105,122,0.4),0_0_18px_rgba(56,189,248,0.22)] before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:[clip-path:polygon(0_16px,16px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-16px),calc(100%-16px)_100%,24px_100%,0_calc(100%-24px))] before:bg-[linear-gradient(102deg,rgba(34,211,238,0.95)_0%,rgba(56,189,248,0.55)_22%,rgba(21,24,35,0)_36%,rgba(245,158,11,0.62)_56%,rgba(192,132,252,0.74)_82%,rgba(244,114,182,0.9)_100%)] before:opacity-95 before:transition-all before:duration-200 before:ease-out after:pointer-events-none after:absolute after:inset-[-2px] after:content-[''] after:[clip-path:polygon(0_18px,18px_0,calc(100%-28px)_0,100%_28px,100%_calc(100%-18px),calc(100%-18px)_100%,28px_100%,0_calc(100%-28px))] after:border after:border-cyan-300/35 after:shadow-[0_0_0_1px_rgba(34,211,238,0.24)_inset,0_0_14px_rgba(34,211,238,0.28),0_0_28px_rgba(245,158,11,0.14)] after:transition-all after:duration-200 after:ease-out hover:before:opacity-100 hover:before:brightness-110 hover:after:translate-x-[1px] hover:after:-translate-y-[1px] hover:after:border-cyan-200/60 hover:after:shadow-[0_0_0_1px_rgba(34,211,238,0.34)_inset,0_0_20px_rgba(34,211,238,0.34),0_0_38px_rgba(245,158,11,0.2)]">
            <div className="relative bg-[#020205]/92 p-7 [clip-path:polygon(0_16px,16px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-16px),calc(100%-16px)_100%,24px_100%,0_calc(100%-24px))] sm:p-10">
            <p className="text-2xl leading-relaxed text-zinc-100 sm:text-4xl">
              Members are taught to master money and power systems without succumbing to their enslavement or morally corrupting properties.
              <br className="hidden sm:block" /> This is the definition of true success and greatness. This is the true meaning of money, power and life mastery.
            </p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-6 pt-12 sm:px-6 sm:pb-8 sm:pt-16">
          <div className="mx-auto w-full max-w-[min(1650px,96vw)]">
            <h2 className="text-4xl font-black uppercase tracking-[0.04em] text-white sm:text-6xl">
              Follow the Path of Kings and Emperors
            </h2>
            <div className="mt-8 space-y-0 bg-gradient-to-r from-cyan-300 via-violet-500 to-fuchsia-500 p-[5px] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)] shadow-[0_0_24px_rgba(129,140,248,0.36)]">
              <div className="space-y-0 bg-[#020205]/92 [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]">
              {[
                'True leaders are not born - they are forged in the crucible of wisdom passed down through the ages.',
                'The great figures of history, from monarchs to revolutionaries, have left behind more than mere stories - they have endowed us with a roadmap to greatness.',
                'The Syndicate philosophy acknowledges this ancient truth while redefining it for a modern age.',
                'To study their lives is not just to learn tactics and strategy, but to uncover the soul of money and power itself.',
                'To achieve greatness is to transcend selfish ambition and become a powerhouse of mastery.',
              ].map((line, idx) => (
                <div
                  key={line}
                  className="what-you-get-stagger-row relative z-0 grid gap-3 border-b border-white/12 px-6 py-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:-translate-y-1 hover:scale-[1.1] sm:grid-cols-[112px_1fr] sm:px-8 sm:py-8 last:border-b-0"
                  style={{ animationDelay: `${idx * 0.16}s` }}
                >
                  <span className="text-base font-semibold tracking-[0.2em] text-zinc-400">0{idx + 1}.</span>
                  <p className="text-xl text-zinc-100/92 sm:text-[1.62rem]">{line}</p>
                </div>
              ))}
              </div>
            </div>
            <div className="mx-auto mt-5 flex w-full justify-center sm:mt-8">
              <div className="h-[250px] w-[250px] sm:h-[320px] sm:w-[320px]">
                <Image
                  src="/assets/coin-gold.png"
                  alt="Rotating syndicate coin"
                  width={320}
                  height={320}
                  className="coin-wheel-lr h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-10 pt-1 sm:px-6 sm:pb-16 sm:pt-2">
          <div className="mx-auto w-full max-w-[min(1650px,96vw)] rounded-3xl bg-[#020205]/88 p-6 text-center sm:p-10">
            <div className="mt-6 flex flex-wrap justify-center gap-4 sm:mt-8">
              <div className="group relative rounded-xl bg-gradient-to-r from-cyan-300 via-sky-500 to-fuchsia-500 p-[1px]">
                <span className="pointer-events-none absolute inset-[-1px] rounded-xl bg-inherit opacity-70 blur-[10px]" />
                <Link
                  href={loginHref}
                  prefetch
                  className="relative inline-flex min-h-[56px] min-w-[230px] items-center justify-center rounded-xl bg-[#05070c]/92 px-8 py-3 text-base font-bold tracking-[0.08em] text-zinc-100 transition duration-300 hover:scale-[1.04] hover:bg-[#070b14]/95"
                >
                  JOIN NOW
                </Link>
              </div>
              <div className="group relative rounded-xl bg-gradient-to-r from-fuchsia-400 via-violet-500 to-cyan-300 p-[1px]">
                <span className="pointer-events-none absolute inset-[-1px] rounded-xl bg-inherit opacity-70 blur-[10px]" />
                <Link
                  href="/programs"
                  prefetch
                  className="relative inline-flex min-h-[56px] min-w-[230px] items-center justify-center rounded-xl bg-[#05070c]/92 px-8 py-3 text-base font-bold tracking-[0.08em] text-zinc-100 transition duration-300 hover:scale-[1.04] hover:bg-[#070b14]/95"
                >
                  EXPLORE PROGRAMS
                </Link>
              </div>
            </div>
          </div>
        </section>
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
            transform: translate(10px, -8px) rotate(90deg);
          }
          50% {
            transform: translate(0px, -12px) rotate(180deg);
          }
          75% {
            transform: translate(-10px, -8px) rotate(270deg);
          }
        }
      `}</style>
    </div>
  )
}
