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
        'relative left-1/2 z-[2] flex w-[100vw] min-w-[100vw] max-w-none -translate-x-1/2 flex-col overflow-hidden',
        'min-h-[min(100vh,1080px)] shadow-[0_0_48px_rgba(251,191,36,0.08)]',
        'px-[clamp(1.25rem,5vw,3.75rem)] pt-12 pb-[clamp(5rem,18vh,11rem)] md:pt-16 md:pb-[clamp(6.5rem,22vh,13rem)]',
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

      {/* Flat read layer — lighter toward bottom so footage fills the section edge */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#030308]/94 via-[#030308]/90 to-[#030308]/82"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] shadow-[inset_0_0_80px_rgba(0,0,0,0.65),inset_0_-24px_64px_rgba(0,0,0,0.45)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[min(1720px,calc(100vw-2.5rem))] flex-1 flex-col gap-10 md:min-h-[calc(100vh-12rem)] md:flex-row md:items-stretch md:justify-between md:gap-10 lg:gap-14 xl:gap-16">
        <div className="flex min-h-[clamp(20rem,48vh,28rem)] min-w-0 w-full flex-[1.15] flex-col md:min-h-[min(540px,62vh)] lg:flex-[1.2]">
          <div
            className={cn('lightning-glow-card relative h-full min-h-[inherit] w-full max-w-none', AFFILIATE_NOTCH_CLIP)}
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
                'relative flex h-full min-h-[inherit] flex-col overflow-hidden rounded-3xl border border-cyan-400/38 bg-[linear-gradient(168deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.4)_100%)] px-6 py-8 text-center shadow-[0_0_0_1px_rgba(34,211,238,0.42),0_0_32px_rgba(34,211,238,0.32),0_0_64px_rgba(217,70,239,0.16),inset_0_0_28px_rgba(34,211,238,0.08)] backdrop-blur-sm sm:px-9 sm:py-10 md:px-10 md:py-12 md:text-left lg:px-12 lg:py-14',
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
              <div className="relative z-[1] flex flex-1 flex-col">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start md:gap-4">
                  <h2
                    id="affiliate-program-heading"
                    className="public-heading-lightning public-heading-lightning--gold font-display text-[clamp(2.25rem,5vw,3.5rem)] font-black uppercase tracking-[0.12em] sm:text-5xl md:text-6xl md:tracking-[0.14em] lg:text-7xl xl:text-8xl"
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
                <p className="mx-auto mt-5 max-w-none font-mono text-[clamp(0.92rem,1.1vw,1.05rem)] font-semibold uppercase leading-relaxed tracking-[0.1em] text-cyan-100/92 sm:text-base md:mx-0 md:text-lg">
                  The Affiliate Programme is not a simple referral system. It is your entry point into a controlled growth channel where attention becomes leverage and influence becomes measurable results. Every click, every lead, every purchase connected through your network is tracked through your unique referral identity. Your dashboard becomes your command centre — a live intelligence system showing exactly what moves, what converts, and what produces. No empty promises. No vanity numbers. Only real performance data, clear commission tracking, and the tools required to expand your reach.
                </p>
                <p className="mx-auto mt-4 max-w-none font-mono text-[clamp(0.86rem,1vw,0.98rem)] font-medium uppercase leading-relaxed tracking-[0.1em] text-slate-300/95 sm:text-[0.95rem] md:mx-0 md:text-base lg:text-lg">
                  Access is secured through the same elite verification system used across The Syndicate. Once approved: enter the email connected to your affiliate profile, receive your one-time access code, and unlock your private affiliate command dashboard. Inside, you gain access to your referral assets, performance intelligence, commission records, and withdrawal controls — all built for operators who understand that ownership begins with control.
                </p>
                <div className="mt-7 flex justify-center md:justify-start">
                  <Link
                    href="/affiliate"
                    className="hamburger-attract inline-flex min-h-[52px] items-center justify-center rounded-xl border border-cyan-400/60 bg-[linear-gradient(180deg,rgba(34,211,238,0.14)_0%,rgba(0,0,0,0.45)_55%,rgba(88,28,135,0.12)_100%)] px-8 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.5),0_0_22px_rgba(34,211,238,0.38),0_0_40px_rgba(217,70,239,0.12),inset_0_0_16px_rgba(34,211,238,0.1)] transition hover:border-fuchsia-300/55 hover:shadow-[0_0_28px_rgba(217,70,239,0.32),0_0_36px_rgba(34,211,238,0.28)] sm:text-base sm:tracking-[0.18em]"
                  >
                    Affiliate
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coin — wheel spin on Y axis + neon rim glow */}
        <div
          className="hamburger-attract relative flex min-h-[clamp(18rem,44vh,26rem)] w-full min-w-0 flex-1 items-center justify-center self-center md:min-h-[min(540px,62vh)] md:max-w-[44vw] md:flex-[1] lg:max-w-[42vw] [perspective:1100px]"
          aria-hidden
        >
          <div className="absolute inset-0 blur-3xl md:scale-125">
            <div className="mx-auto h-[clamp(16rem,38vw,22rem)] w-[clamp(16rem,38vw,22rem)] rounded-full bg-gradient-to-br from-amber-400/35 via-amber-500/20 to-amber-600/10 sm:h-[clamp(18rem,42vw,24rem)] sm:w-[clamp(18rem,42vw,24rem)] md:h-[clamp(20rem,36vw,26rem)] md:w-[clamp(20rem,36vw,26rem)] lg:h-[clamp(22rem,34vw,28rem)] lg:w-[clamp(22rem,34vw,28rem)]" />
          </div>
          <motion.div
            className="relative rounded-full border border-amber-300/70 shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_20px_rgba(251,191,36,0.32),0_0_48px_rgba(251,191,36,0.4),0_24px_56px_rgba(0,0,0,0.88)] ring-2 ring-amber-300/70 ring-offset-[6px] ring-offset-[#070510]/90 md:ring-offset-8"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          >
            <Image
              src="/assets/coin-gold.png"
              alt=""
              width={640}
              height={640}
              className="relative h-[clamp(15rem,36vw,20rem)] w-[clamp(15rem,36vw,20rem)] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.92)] sm:h-[clamp(17rem,40vw,22rem)] sm:w-[clamp(17rem,40vw,22rem)] md:h-[clamp(19rem,34vw,24rem)] md:w-[clamp(19rem,34vw,24rem)] lg:h-[clamp(21rem,32vw,26rem)] lg:w-[clamp(21rem,32vw,26rem)] xl:h-[28rem] xl:w-[28rem]"
              sizes="(max-width: 640px) 320px, (max-width: 1024px) 420px, (max-width: 1280px) 480px, 560px"
            />
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-8 w-full max-w-[min(1720px,calc(100vw-2.5rem))] md:mt-0">
        {helpOpen ? (
          <motion.div
            id="affiliate-how-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-1 rounded-xl border border-cyan-400/35 bg-[#060912]/95 p-5 text-[16px] leading-relaxed text-slate-200 shadow-[0_0_32px_rgba(34,211,238,0.18),0_0_48px_rgba(217,70,239,0.08)] backdrop-blur-sm sm:mx-2 sm:text-[17px] md:mx-0 md:p-6 md:text-lg"
          >
            <p className="font-semibold uppercase tracking-[0.14em] text-cyan-200/95">How to use it</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-justify marker:text-fuchsia-300/90 md:text-left">
              <li>Enter the Affiliate Programme through the dedicated portal. Access the Affiliate login.</li>
              <li>Verify your identity through the secure one-time code.</li>
              <li>Enter your private affiliate command centre.</li>
              <li>Deploy your referral link. Monitor the entire chain — attention, conversions, revenue, and earned commissions.</li>
            </ol>
            <p className="mt-3 text-justify text-slate-400 md:text-left">
              Your affiliate identity is separate from the member experience. The member system remains protected through its own secure access pathway. Two systems. Two purposes. One Syndicate ecosystem.
            </p>
          </motion.div>
        ) : null}
      </div>

      {/* Fills remaining min-height so money background covers the bottom band */}
      <div className="relative z-0 min-h-[clamp(3.5rem,12vh,7rem)] flex-1 shrink-0" aria-hidden />
    </section>
  )
}
