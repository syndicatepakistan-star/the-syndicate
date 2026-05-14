'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import SiteFooter from '@/components/SiteFooter'
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

const CYBER_BORDER_STYLES = [
  'from-cyan-400 via-blue-500 to-fuchsia-500 shadow-[0_0_30px_rgba(34,211,238,0.46)]',
  'from-fuchsia-400 via-pink-500 to-violet-500 shadow-[0_0_30px_rgba(232,121,249,0.46)]',
  'from-emerald-400 via-cyan-400 to-blue-500 shadow-[0_0_30px_rgba(16,185,129,0.46)]',
  'from-amber-300 via-orange-400 to-rose-500 shadow-[0_0_30px_rgba(251,191,36,0.46)]',
  'from-violet-400 via-indigo-500 to-cyan-400 shadow-[0_0_30px_rgba(129,140,248,0.46)]',
  'from-lime-300 via-emerald-400 to-cyan-400 shadow-[0_0_30px_rgba(132,204,22,0.46)]',
]

export default function GlobalBottomSections() {
  const pathname = usePathname()
  const router = useRouter()
  const loginHref = syndicateOtpLoginHref()
  const isProgramsPage = pathname === '/programs'
  const isWhatYouGetPage = pathname === '/what-you-get'
  const actionWord = pathname === '/what-you-get' ? 'BE POWERFUL' : pathname === '/our-methods' ? 'BE RICH' : 'MASTER MONEY'
  const sectionLayoutClass = isWhatYouGetPage
    ? 'relative flex h-[100dvh] min-h-[100dvh] w-full items-center overflow-hidden px-4 py-12 sm:px-6 sm:py-14'
    : 'relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20'

  useEffect(() => {
    // Warm common destinations for faster CTA/footer navigation.
    router.prefetch('/')
    router.prefetch('/what-you-get')
    router.prefetch('/our-methods')
    router.prefetch('/programs')
    router.prefetch('/membership')
    router.prefetch('/affiliate')
    router.prefetch('/login')
    router.prefetch(loginHref)
  }, [router, loginHref])

  return (
    <>
      <section id="joinNowSection" className={sectionLayoutClass}>
        <div className="pointer-events-none absolute inset-0">
          <video autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover opacity-55">
            <source src="/assets/v.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/72" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[min(1700px,98vw)] px-3 text-center">
          {isWhatYouGetPage && (
            <div className="relative mx-auto mb-10 w-full max-w-[min(1600px,96vw)] overflow-hidden rounded-3xl bg-transparent p-7 shadow-[0_0_45px_rgba(34,211,238,0.1)] sm:mb-12 sm:p-10">
              <h2 className="bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-2xl font-black tracking-[0.02em] text-transparent drop-shadow-[0_0_16px_rgba(251,191,36,0.34)] sm:text-4xl">
                You Leave With Clarity, Discipline, and Executable Systems
              </h2>
              <p className="mx-auto mt-4 max-w-4xl text-sm leading-relaxed text-zinc-100/85 sm:text-base">
                Not theory. Not noise. Every module is designed for real-world leverage across business, finances, and leadership - so your execution stays sharp
                and your growth stays controlled.
              </p>
              <div className="relative mx-auto mt-8 grid w-full max-w-[1300px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {['Clarity', 'Discipline', 'Execution', 'Leverage', 'Strategy', 'Scale'].map((keyword, index) => (
                  <div
                    key={keyword}
                    className={`cyber-chip-animate group relative bg-gradient-to-r p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 ${CYBER_BORDER_STYLES[index % CYBER_BORDER_STYLES.length]}`}
                    style={{ animationDelay: `${index * 0.18}s` }}
                  >
                    <span className="pointer-events-none absolute inset-[-1px] rounded-[10px] bg-inherit opacity-75 blur-[10px] transition duration-300 group-hover:opacity-100" />
                    <span className="relative inline-flex min-h-[58px] w-full items-center justify-center bg-[#05070c]/92 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-zinc-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.28)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 group-hover:bg-[#070b14]/96 sm:min-h-[66px] sm:text-sm">
                      <span className="pointer-events-none absolute left-2 top-1.5 h-[2px] w-4 bg-cyan-200/80 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                      <span className="pointer-events-none absolute bottom-1.5 right-2 h-[2px] w-4 bg-fuchsia-200/80 shadow-[0_0_8px_rgba(232,121,249,0.7)]" />
                      <span className="pointer-events-none absolute right-1.5 top-2 h-4 w-[2px] bg-blue-200/70 shadow-[0_0_8px_rgba(96,165,250,0.65)]" />
                      {keyword}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isProgramsPage ? (
            <h2 className="mx-auto mt-3 max-w-[30ch] text-4xl font-black uppercase leading-[1.08] tracking-[0.05em] text-amber-100 sm:text-6xl md:text-7xl">
              <span className="block">
                IF YOU WANT
                <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">FREEDOM</span>
                FROM
              </span>
              <span className="mt-1.5 block">
                <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">9 TO 5</span>
                JOIN
                <span className="hamburger-attract mx-2 inline-block text-amber-100 drop-shadow-[0_0_32px_rgba(251,191,36,0.92)]">THE SYNDICATE</span>
              </span>
            </h2>
          ) : (
            <h2 className="mx-auto mt-3 max-w-[26ch] text-4xl font-black uppercase leading-[1.08] tracking-[0.05em] text-amber-100 sm:text-6xl md:text-7xl">
              <span className="block">IF YOU WANT TO</span>
              <span className="mt-1.5 block">
                <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">{actionWord}</span>
                <span className="mx-2 inline-block">JOIN</span>
                <span className="hamburger-attract mx-2 inline-block text-amber-100 drop-shadow-[0_0_32px_rgba(251,191,36,0.92)]">THE SYNDICATE</span>
              </span>
            </h2>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-4 sm:mt-12">
            {isWhatYouGetPage ? (
              <>
                <div className="cyber-chip-animate group relative bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                  <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
                  <Link
                    href="/membership"
                    prefetch
                    className="hamburger-attract relative inline-flex min-h-[58px] min-w-[240px] items-center justify-center bg-[#05070c]/92 px-10 py-4 text-lg font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.04] hover:bg-[#070b14]/95"
                  >
                    JOIN NOW
                  </Link>
                </div>
                <div className="cyber-chip-animate group relative bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                  <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
                  <Link
                    href="/programs"
                    prefetch
                    className="hamburger-attract relative inline-flex min-h-[58px] min-w-[240px] items-center justify-center bg-[#05070c]/92 px-10 py-4 text-lg font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.04] hover:bg-[#070b14]/95"
                  >
                    EXPLORE PROGRAMS
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/membership"
                  prefetch
                  className="hamburger-attract inline-flex min-h-[56px] min-w-[220px] items-center justify-center rounded-xl border border-amber-300/80 bg-black/80 px-10 py-4 text-lg font-bold tracking-[0.03em] text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.45)] transition hover:scale-[1.04] hover:bg-black/95 hover:shadow-[0_0_36px_rgba(251,191,36,0.68)]"
                >
                  JOIN NOW
                </Link>
                <Link
                  href="/programs"
                  prefetch
                  className="hamburger-attract inline-flex min-h-[56px] min-w-[220px] items-center justify-center rounded-xl border border-amber-300/80 bg-black/80 px-10 py-4 text-lg font-bold tracking-[0.03em] text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.45)] transition hover:scale-[1.04] hover:bg-black/95 hover:shadow-[0_0_36px_rgba(251,191,36,0.68)]"
                >
                  EXPLORE PROGRAMS
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={40} />
      <SiteFooter />
    </>
  )
}

