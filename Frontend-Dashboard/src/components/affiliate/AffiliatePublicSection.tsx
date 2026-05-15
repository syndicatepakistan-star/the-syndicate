'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const VIMEO_EMBED =
  'https://player.vimeo.com/video/988922121?background=1&autoplay=1&loop=1&muted=1&controls=0&playsinline=1'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const AFFILIATE_NOTCH_CLIP =
  '[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]'

export function AffiliatePublicSection({ className }: { className?: string }) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <section
      id="affiliate-program"
      className={cn(
        'relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden',
        'min-h-[60vh] shadow-[0_0_48px_rgba(251,191,36,0.08)]',
        'px-[clamp(0.75rem,2.2vw,2rem)] py-12 md:py-16',
        className,
      )}
      aria-labelledby="affiliate-program-heading"
    >
      {/* Vimeo background — [Falling Money on Vimeo](https://player.vimeo.com/video/988922121) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <iframe
          title=""
          src={VIMEO_EMBED}
          className="pointer-events-none absolute left-1/2 top-1/2 opacity-60"
          style={{
            border: 'none',
            width: '100vw',
            height: '56.25vw',
            minHeight: '100%',
            minWidth: '177.77vh',
            transform: 'translate(-50%, -50%)',
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>

      {/* Flat read layer — no colour wash over the footage */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[#030308]/93" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[1] shadow-[inset_0_0_120px_rgba(0,0,0,0.78),inset_0_0_48px_rgba(0,0,0,0.55)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 md:min-h-[calc(60vh-6rem)] md:flex-row md:items-center md:justify-between md:gap-16 lg:gap-24 xl:gap-28">
        <div className="min-w-0 flex-1 px-2 md:max-w-[min(100%,42rem)] md:px-0 lg:max-w-[46rem]">
          <div
            className={cn('lightning-glow-card relative w-full', AFFILIATE_NOTCH_CLIP)}
            style={
              {
                ['--lightning-color' as string]: 'rgba(34, 211, 238, 0.92)',
                ['--lightning-color-soft' as string]: 'rgba(217, 70, 239, 0.52)',
              } as CSSProperties
            }
          >
            <span
              className="pointer-events-none absolute inset-[-2px] opacity-85 blur-[18px]"
              style={{
                background:
                  'radial-gradient(ellipse 75% 50% at 20% 0%, rgba(34,211,238,0.28), transparent 55%), radial-gradient(ellipse 65% 45% at 95% 100%, rgba(217,70,239,0.2), transparent 52%)',
              }}
            />
            <div
              className={cn(
                'relative overflow-hidden rounded-3xl border border-cyan-400/38 bg-[linear-gradient(168deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.4)_100%)] px-5 py-6 text-center shadow-[0_0_0_1px_rgba(34,211,238,0.42),0_0_32px_rgba(34,211,238,0.32),0_0_64px_rgba(217,70,239,0.16),inset_0_0_28px_rgba(34,211,238,0.08)] backdrop-blur-sm sm:px-7 sm:py-8 md:text-left',
                AFFILIATE_NOTCH_CLIP,
              )}
            >
              <div
                className="pointer-events-none absolute inset-[5px] rounded-[22px] border border-fuchsia-500/25 shadow-[inset_0_0_24px_rgba(217,70,239,0.12),0_0_22px_rgba(217,70,239,0.1)]"
                style={{
                  clipPath:
                    'polygon(12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px),0 12px)',
                }}
              />
              <div className="relative z-[1]">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start md:gap-4">
                  <h2
                    id="affiliate-program-heading"
                    className="programs-heading-glow font-display text-4xl font-black uppercase tracking-[0.12em] text-white sm:text-5xl md:text-6xl md:tracking-[0.14em] lg:text-7xl"
                  >
                    Affiliate
                  </h2>
                  <button
                    type="button"
                    onClick={() => setHelpOpen((v) => !v)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/50 bg-black/70 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.4),0_0_26px_rgba(34,211,238,0.12)] transition hover:border-cyan-300/75 hover:text-cyan-50 hover:shadow-[0_0_26px_rgba(34,211,238,0.45)] md:h-11 md:w-11"
                    aria-expanded={helpOpen}
                    aria-controls="affiliate-how-panel"
                    title="How it works"
                  >
                    <HelpCircle className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                    <span className="sr-only">How affiliate login works</span>
                  </button>
                </div>
                <p className="mx-auto mt-5 max-w-none font-mono text-[0.92rem] font-semibold uppercase leading-relaxed tracking-[0.1em] text-cyan-100/92 sm:text-[0.98rem] md:mx-0">
                  <span className="text-fuchsia-200/95">Weaponize the link.</span> Your referral IDs sit on every click,
                  every lead, every checkout that rolls through your pipe — funnel, partner dashboard, commissions that
                  don&apos;t sugar-coat the truth. Built for{' '}
                  <strong className="text-white">operators</strong> who want leverage, not slide decks.
                </p>
                <p className="mx-auto mt-4 max-w-none font-mono text-[0.86rem] font-medium uppercase leading-relaxed tracking-[0.1em] text-slate-300/95 sm:text-[0.9rem] md:mx-0">
                  <span className="text-cyan-200/90">Lock the channel.</span> Once you&apos;re cleared, hit{' '}
                  <strong className="text-white">Affiliate login</strong> with the email we already hold — we ship a{' '}
                  <strong className="text-amber-200/95">one-shot OTP</strong> (same luxury flow as members). Punch the
                  code: <strong className="text-white">stats, referral kit, withdrawals</strong> when you&apos;ve earned
                  them — live in the browser, no second-class portal.
                </p>
                <div className="mt-7 flex justify-center md:justify-start">
                  <Link
                    href="/affiliate-login"
                    className="hamburger-attract inline-flex min-h-[52px] items-center justify-center rounded-xl border border-cyan-400/60 bg-[linear-gradient(180deg,rgba(34,211,238,0.14)_0%,rgba(0,0,0,0.45)_55%,rgba(88,28,135,0.12)_100%)] px-8 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.5),0_0_22px_rgba(34,211,238,0.38),0_0_40px_rgba(217,70,239,0.12),inset_0_0_16px_rgba(34,211,238,0.1)] transition hover:border-fuchsia-300/55 hover:shadow-[0_0_28px_rgba(217,70,239,0.32),0_0_36px_rgba(34,211,238,0.28)] sm:text-base sm:tracking-[0.18em]"
                  >
                    Affiliate login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coin — wheel spin on Y axis + neon rim glow */}
        <div
          className="hamburger-attract relative flex shrink-0 items-center justify-center self-center md:self-auto [perspective:900px]"
          aria-hidden
        >
          <div className="absolute inset-0 blur-3xl md:scale-110">
            <div className="mx-auto h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/35 via-amber-500/20 to-amber-600/10 sm:h-72 sm:w-72 md:h-96 md:w-96 lg:h-[28rem] lg:w-[28rem]" />
          </div>
          <motion.div
            className="relative rounded-full border border-amber-300/70 shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_16px_rgba(251,191,36,0.28),0_0_40px_rgba(251,191,36,0.35),0_22px_48px_rgba(0,0,0,0.88)] ring-2 ring-amber-300/70 ring-offset-4 ring-offset-[#070510]/90"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          >
            <Image
              src="/assets/coin-gold.png"
              alt=""
              width={512}
              height={512}
              className="relative h-60 w-60 object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.92)] sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-96 lg:w-96"
              sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 384px"
            />
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-8 w-full max-w-6xl md:mt-0">
        {helpOpen ? (
          <motion.div
            id="affiliate-how-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-1 rounded-xl border border-cyan-400/35 bg-[#060912]/95 p-5 text-[16px] leading-relaxed text-slate-200 shadow-[0_0_32px_rgba(34,211,238,0.18),0_0_48px_rgba(217,70,239,0.08)] backdrop-blur-sm sm:mx-2 sm:text-[17px] md:mx-0 md:p-6 md:text-lg"
          >
            <p className="font-semibold uppercase tracking-[0.14em] text-cyan-200/95">How to use it</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-justify marker:text-fuchsia-300/90 md:text-left">
              <li>Open the <Link href="/affiliate" className="text-cyan-200 underline-offset-2 hover:text-cyan-50 hover:underline">Affiliate programme</Link> page, then use &quot;Affiliate login&quot; (or the site menu).</li>
              <li>Enter the email tied to your affiliate profile.</li>
              <li>Enter the 6-digit code we email you — then your dashboard opens in the browser.</li>
              <li>Copy your referral link from the dashboard and share it; returning traffic and purchases attach to you.</li>
            </ol>
            <p className="mt-3 text-justify text-slate-400 md:text-left">
              This login is separate from the member area. Member access still uses Join Now / login with the main OTP
              flow.
            </p>
          </motion.div>
        ) : null}

      </div>
    </section>
  )
}
