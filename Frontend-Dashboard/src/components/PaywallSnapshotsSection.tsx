'use client'

import Image from 'next/image'
import Link from 'next/link'
import { syndicateOtpLoginHref } from '@/lib/syndicate-otp-paths'

type SnapshotItem = {
  src: string
  title: string
  description: string
  frame: string
  tone: string
  aura: string
}

const SNAPSHOTS: SnapshotItem[] = [
  {
    src: '/assets/paywall/programs-snapshot.png',
    title: 'PROGRAM EXECUTION HUB',
    description:
      'Access structured programs, actionable lessons, and progress systems from a personalized dashboard.',
    frame: 'border-sky-300/95 border-[8px] shadow-[0_0_0_1px_rgba(56,189,248,0.95),0_0_24px_rgba(56,189,248,0.72),0_0_58px_rgba(56,189,248,0.5),0_0_110px_rgba(56,189,248,0.34),inset_0_0_20px_rgba(56,189,248,0.28)]',
    tone: 'from-sky-500/24 via-cyan-500/16 to-indigo-600/22',
    aura: 'from-cyan-400/45 via-sky-500/28 to-transparent',
  },
  {
    src: '/assets/paywall/syndicate-mode-snapshot.png',
    title: 'SYNDICATE MODE DASHBOARD',
    description:
      'Use curated pathways to pick skills that align with your style, goals, and execution level.',
    frame: 'border-lime-300/95 border-[8px] shadow-[0_0_0_1px_rgba(163,230,53,0.95),0_0_24px_rgba(163,230,53,0.72),0_0_58px_rgba(163,230,53,0.5),0_0_110px_rgba(163,230,53,0.34),inset_0_0_20px_rgba(163,230,53,0.28)]',
    tone: 'from-lime-400/24 via-emerald-500/16 to-amber-500/22',
    aura: 'from-lime-300/42 via-emerald-500/28 to-transparent',
  },
  {
    src: '/assets/paywall/dashboard-snapshot.png',
    title: 'MEMBER WORKSPACE OVERVIEW',
    description:
      'Stay ahead with trend-driven modules that help you identify opportunities before they saturate.',
    frame: 'border-fuchsia-300/95 border-[8px] shadow-[0_0_0_1px_rgba(244,114,182,0.95),0_0_24px_rgba(244,114,182,0.72),0_0_58px_rgba(244,114,182,0.5),0_0_110px_rgba(244,114,182,0.34),inset_0_0_20px_rgba(244,114,182,0.28)]',
    tone: 'from-fuchsia-500/24 via-violet-500/16 to-blue-600/22',
    aura: 'from-fuchsia-400/42 via-violet-500/28 to-transparent',
  },
  {
    src: '/assets/paywall/Affiliate%20Portal.png',
    title: 'AFFILIATE PORTAL',
    description:
      'Track referrals, monitor commissions, and manage withdrawal requests from your private affiliate dashboard.',
    frame: 'border-rose-300/95 border-[8px] shadow-[0_0_0_1px_rgba(251,113,133,0.95),0_0_24px_rgba(251,113,133,0.72),0_0_58px_rgba(251,113,133,0.5),0_0_110px_rgba(251,113,133,0.34),inset_0_0_20px_rgba(251,113,133,0.28)]',
    tone: 'from-rose-500/24 via-red-500/16 to-orange-600/22',
    aura: 'from-rose-400/42 via-orange-500/28 to-transparent',
  },
]

export default function PaywallSnapshotsSection() {
  return (
    <section className="relative min-h-[100dvh] w-full min-w-0 overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="relative h-full w-full">
          <Image
            src="/assets/cb.gif"
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            unoptimized
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 py-14 sm:px-6 md:px-8 md:py-16">
        <div className="mx-auto mb-10 max-w-5xl text-center">
          <h2 className="text-4xl font-black uppercase tracking-[0.03em] text-white sm:text-5xl md:text-6xl">
            WHAT YOU CAN ACCESS
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {SNAPSHOTS.map((snapshot) => (
            <div
              key={snapshot.title}
              className={`group relative overflow-hidden bg-transparent p-[1px] transition duration-300 [clip-path:polygon(24px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-28px),calc(100%-28px)_100%,28px_100%,0_calc(100%-24px),0_24px)] ${snapshot.frame}`}
            >
              <span className={`pointer-events-none absolute -inset-8 -z-10 bg-gradient-to-br ${snapshot.aura} blur-[44px]`} />
              <article className="relative flex h-full min-h-[clamp(320px,40vh,420px)] flex-col border border-zinc-100/35 bg-[#03050b]/94 p-4 sm:p-5 [clip-path:polygon(26px_0,calc(100%-26px)_0,100%_26px,100%_calc(100%-30px),calc(100%-30px)_100%,30px_100%,0_calc(100%-26px),0_26px)]">
                <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${snapshot.tone}`} />
                <span className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:34px_34px]" />
                <span className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.15)_2px,rgba(255,255,255,0.15)_3px)]" />
                <span className="pointer-events-none absolute left-0 top-[22%] h-12 w-[2px] bg-zinc-100/65" />
                <span className="pointer-events-none absolute right-0 top-[22%] h-12 w-[2px] bg-zinc-100/65" />
                <span className="pointer-events-none absolute bottom-[22%] left-0 h-12 w-[2px] bg-zinc-100/65" />
                <span className="pointer-events-none absolute bottom-[22%] right-0 h-12 w-[2px] bg-zinc-100/65" />
                <span className="pointer-events-none absolute left-3 top-3 h-7 w-7 border-l-2 border-t-2 border-zinc-100/90 [clip-path:polygon(0_0,100%_0,100%_28%,28%_28%,28%_100%,0_100%)]" />
                <span className="pointer-events-none absolute right-3 top-3 h-7 w-7 border-r-2 border-t-2 border-zinc-100/90 [clip-path:polygon(0_0,100%_0,100%_100%,72%_100%,72%_28%,0_28%)]" />
                <span className="pointer-events-none absolute bottom-3 left-3 h-7 w-7 border-b-2 border-l-2 border-zinc-100/90 [clip-path:polygon(0_0,28%_0,28%_72%,100%_72%,100%_100%,0_100%)]" />
                <span className="pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-2 border-r-2 border-zinc-100/90 [clip-path:polygon(72%_0,100%_0,100%_100%,0_100%,0_72%,72%_72%)]" />
                <span className="pointer-events-none absolute left-[22px] top-0 h-[2px] w-14 bg-zinc-100/70" />
                <span className="pointer-events-none absolute right-[22px] bottom-0 h-[2px] w-14 bg-zinc-100/70" />
                <span className="pointer-events-none absolute left-1/2 top-2 h-[2px] w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-100/90 to-transparent [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)]" />
                <span className="pointer-events-none absolute bottom-2 left-1/2 h-[2px] w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-100/90 to-transparent [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]" />
                <div className="relative rounded-md border border-zinc-100/25 bg-black/45 px-4 py-3 backdrop-blur-[1px] [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]">
                  <span className="pointer-events-none absolute right-3 top-2 h-[1px] w-10 bg-zinc-100/55" />
                  <span className="pointer-events-none absolute bottom-2 left-3 h-[1px] w-10 bg-zinc-100/55" />
                  <h3 className="text-xl font-black uppercase leading-tight text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] sm:text-2xl">
                    {snapshot.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-100 sm:text-[1.08rem]">
                    {snapshot.description}
                  </p>
                </div>
                <div className="relative mt-4 h-[clamp(180px,36vw,260px)] sm:h-[clamp(220px,30vw,320px)] lg:h-[clamp(240px,26vw,340px)] overflow-hidden border border-zinc-100/30 bg-transparent shadow-[0_0_12px_rgba(255,255,255,0.3)] [clip-path:polygon(22px_0,calc(100%-22px)_0,100%_22px,100%_calc(100%-24px),calc(100%-24px)_100%,24px_100%,0_calc(100%-22px),0_22px)]">
                  <span className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.24))]" />
                  <span className="pointer-events-none absolute left-1/2 top-2 z-[3] h-[1px] w-20 -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-100/55 to-transparent" />
                  <span className="pointer-events-none absolute bottom-2 right-3 z-[3] h-2 w-2 border-r border-b border-zinc-100/65" />
                  <Image
                    src={snapshot.src}
                    alt={snapshot.title}
                    fill
                    sizes="(max-width: 639px) 90vw, (max-width: 1023px) 88vw, (max-width: 1200px) 46vw, 42vw"
                    className="object-cover object-center sm:object-top saturate-[1.08] contrast-[1.03]"
                  />
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-6xl text-center sm:mt-12">
          <h3 className="mx-auto max-w-[34ch] text-3xl font-black uppercase leading-[1.16] tracking-[0.05em] text-amber-100 drop-shadow-[0_0_16px_rgba(251,191,36,0.42)] sm:text-4xl md:text-5xl">
            <span className="mt-2 block">
              IF YOU WANT
              <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_28px_rgba(251,191,36,0.95)]">SUCCESS</span>
              JOIN
              <span className="hamburger-attract mx-2 inline-block text-amber-100 drop-shadow-[0_0_26px_rgba(251,191,36,0.9)]">THE SYNDICATE</span>
            </span>
          </h3>
          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-4 sm:mt-10">
            <div className="group relative bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
              <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
              <Link
                href={syndicateOtpLoginHref()}
                className="hamburger-attract relative inline-flex min-h-[56px] min-w-[220px] items-center justify-center bg-[#05070c]/90 px-8 py-3 text-base font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.03] hover:bg-[#070b14]/94"
              >
                JOIN NOW
              </Link>
            </div>
            <div className="group relative bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
              <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
              <Link
                href="/programs"
                className="hamburger-attract relative inline-flex min-h-[56px] min-w-[220px] items-center justify-center bg-[#05070c]/90 px-8 py-3 text-base font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.03] hover:bg-[#070b14]/94"
              >
                EXPLORE PROGRAMS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

