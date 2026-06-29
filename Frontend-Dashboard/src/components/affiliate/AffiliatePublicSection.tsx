'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type CSSProperties } from 'react'
import { HelpCircle } from 'lucide-react'

const VIMEO_EMBED =
  'https://player.vimeo.com/video/988922121?background=1&autoplay=1&loop=1&muted=1&controls=0&playsinline=1'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const AFFILIATE_INTRO_PARAGRAPHS = [
  'The Affiliate Programme is not a simple referral system. It is your entry point into the Syndicate Money and Power Structure — where attention becomes leverage and influence becomes measurable results. Every click, every lead, every purchase connected through your network is tracked through your unique referral identity. Your dashboard becomes your command centre — a live intelligence system showing exactly what moves, what converts, and what produces. No empty promises. No vanity numbers. Only real performance data, clear commission tracking, and the tools required to expand your reach.',
  'Access is secured through the same elite verification system used across The Syndicate Platform. Once approved: enter the email connected to your affiliate profile, receive your one-time access code, and unlock your private affiliate command dashboard. Inside, you gain access to your referral assets, performance intelligence, commission records, and withdrawal controls — all built for operators who understand that business mastery begins with control.',
] as const

const AFFILIATE_HOW_TO_STEPS = [
  'Enter the Affiliate Programme through the dedicated portal. Access the Affiliate login.',
  'Verify your identity through the secure one-time code.',
  'Enter your private affiliate command centre.',
  'Deploy your referral link. Monitor the entire chain — attention, conversions, revenue, and earned commissions.',
] as const

const AFFILIATE_BODY_CLASS =
  'w-full font-[family-name:var(--font-body)] text-[clamp(0.9rem,2.2vw,1.05rem)] font-medium leading-relaxed tracking-normal text-cyan-100/92 text-left hyphens-auto sm:text-base md:text-lg md:text-justify'

const AFFILIATE_HOW_TO_HEADING_CLASS =
  'w-full font-[family-name:var(--font-heading)] text-[clamp(0.95rem,2.4vw,1.1rem)] font-bold uppercase tracking-[0.08em] text-fuchsia-200/95 text-left sm:tracking-[0.1em]'

const AFFILIATE_HOW_TO_LIST_CLASS =
  'mt-3 w-full list-decimal space-y-2.5 pl-5 font-[family-name:var(--font-body)] text-[clamp(0.88rem,2.1vw,1rem)] font-medium leading-relaxed tracking-normal text-slate-300/95 text-left hyphens-auto marker:text-fuchsia-300/90 sm:text-[0.95rem] md:text-base'

const AFFILIATE_NOTCH_CLIP =
  '[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]'

export function AffiliatePublicSection({ className }: { className?: string }) {
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    if (!helpOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [helpOpen])

  return (
    <section
      id="affiliate-program"
      className={cn(
        'relative left-1/2 z-[2] flex w-[100vw] min-w-[100vw] max-w-none -translate-x-1/2 flex-col overflow-hidden bg-black',
        'shadow-[0_0_48px_rgba(251,191,36,0.08)]',
        'px-[clamp(1rem,4vw,3.75rem)] pt-4 pb-3 sm:pt-5 sm:pb-4 md:pt-6 md:pb-5',
        className,
      )}
      aria-labelledby="affiliate-program-heading"
    >
      {/* Vimeo background — [Falling Money on Vimeo](https://player.vimeo.com/video/988922121) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <iframe
          title=""
          src={VIMEO_EMBED}
          className="pointer-events-none absolute left-1/2 top-1/2 opacity-50 md:opacity-45"
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

      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/72" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#030308]/94 via-[#030308]/90 to-[#020208]/96"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] shadow-[inset_0_0_80px_rgba(0,0,0,0.65),inset_0_-24px_64px_rgba(0,0,0,0.45)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[min(1720px,calc(100vw-2.5rem))] flex-col gap-6 md:flex-row md:items-stretch md:justify-between md:gap-10 lg:gap-14 xl:gap-16">
        <div className="flex min-h-0 min-w-0 w-full flex-[1.15] flex-col md:min-h-[min(420px,52vh)] lg:flex-[1.2]">
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
                'relative flex h-full min-h-[inherit] flex-col overflow-hidden rounded-3xl border border-cyan-400/38 bg-[linear-gradient(168deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0.4)_100%)] px-6 py-8 shadow-[0_0_0_1px_rgba(34,211,238,0.42),0_0_32px_rgba(34,211,238,0.32),0_0_64px_rgba(217,70,239,0.16),inset_0_0_28px_rgba(34,211,238,0.08)] backdrop-blur-sm sm:px-9 sm:py-10 md:px-10 md:py-12 lg:px-12 lg:py-14',
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
                <div className="relative z-[1] flex flex-1 flex-col text-left">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
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
                    aria-label={helpOpen ? 'Hide how to use affiliate login' : 'Show how to use affiliate login'}
                  >
                    <HelpCircle className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
                  </button>
                </div>
                <div className="mt-5 w-full space-y-4">
                  {AFFILIATE_INTRO_PARAGRAPHS.map((paragraph, index) => (
                    <p key={paragraph.slice(0, 24)} className={cn(AFFILIATE_BODY_CLASS, index > 0 && 'text-slate-300/95')}>
                      {paragraph}
                    </p>
                  ))}
                  {helpOpen ? (
                    <div
                      id="affiliate-how-panel"
                      className="rounded-xl border border-fuchsia-500/25 bg-black/90 px-4 py-5 shadow-[inset_0_0_32px_rgba(0,0,0,0.65),0_0_24px_rgba(217,70,239,0.12)] sm:px-5 sm:py-6"
                      role="region"
                      aria-labelledby="affiliate-how-to-use-heading"
                    >
                      <p id="affiliate-how-to-use-heading" className={AFFILIATE_HOW_TO_HEADING_CLASS}>
                        How to use it
                      </p>
                      <ol className={AFFILIATE_HOW_TO_LIST_CLASS}>
                        {AFFILIATE_HOW_TO_STEPS.map((step, index) => (
                          <li key={step.slice(0, 28)}>
                            <span className="sr-only">Step {index + 1}. </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </div>
                <div className="mt-7 flex justify-start">
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
          className="relative flex min-h-[clamp(12rem,30vh,18rem)] w-full min-w-0 flex-1 items-center justify-center self-center md:min-h-[min(420px,52vh)] md:max-w-[44vw] md:flex-[1] lg:max-w-[42vw] max-md:mt-2"
          aria-hidden
        >
          <div className="absolute inset-0 blur-3xl md:scale-125">
            <div className="mx-auto h-[clamp(16rem,38vw,22rem)] w-[clamp(16rem,38vw,22rem)] rounded-full bg-gradient-to-br from-amber-400/35 via-amber-500/20 to-amber-600/10 sm:h-[clamp(18rem,42vw,24rem)] sm:w-[clamp(18rem,42vw,24rem)] md:h-[clamp(20rem,36vw,26rem)] md:w-[clamp(20rem,36vw,26rem)] lg:h-[clamp(22rem,34vw,28rem)] lg:w-[clamp(22rem,34vw,28rem)]" />
          </div>
          <div className="relative rounded-full border border-amber-300/70 shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_20px_rgba(251,191,36,0.32),0_0_48px_rgba(251,191,36,0.4),0_24px_56px_rgba(0,0,0,0.88)] ring-2 ring-amber-300/70 ring-offset-[4px] ring-offset-[#070510]/90 md:ring-offset-8">
            <Image
              src="/assets/coin-gold.png"
              alt=""
              width={640}
              height={640}
              loading="lazy"
              className="relative h-[clamp(12rem,32vw,17rem)] w-[clamp(12rem,32vw,17rem)] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.92)] sm:h-[clamp(15rem,36vw,20rem)] sm:w-[clamp(15rem,36vw,20rem)] md:h-[clamp(19rem,34vw,24rem)] md:w-[clamp(19rem,34vw,24rem)] lg:h-[clamp(21rem,32vw,26rem)] lg:w-[clamp(21rem,32vw,26rem)] xl:h-[28rem] xl:w-[28rem]"
              sizes="(max-width: 640px) 260px, (max-width: 1024px) 360px, 480px"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
