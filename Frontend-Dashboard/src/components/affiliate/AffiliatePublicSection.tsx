'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const VIMEO_EMBED =
  'https://player.vimeo.com/video/988922121?background=1&autoplay=1&loop=1&muted=1&controls=0&playsinline=1'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

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

      {/* Dystopian read layer + glow */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-[#050208]/95 via-[#0a0614]/92 to-[#10051c]/94"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_90%_70%_at_15%_20%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(ellipse_80%_60%_at_90%_80%,rgba(217,70,239,0.14),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] shadow-[inset_0_0_120px_rgba(0,0,0,0.65),inset_0_0_40px_rgba(6,182,212,0.06)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 md:min-h-[calc(60vh-6rem)] md:flex-row md:items-center md:justify-between md:gap-10 lg:gap-14">
        <div className="min-w-0 flex-1 px-2 text-center md:max-w-[min(100%,36rem)] md:px-0 md:text-left lg:max-w-xl">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start md:gap-4">
            <h2
              id="affiliate-program-heading"
              className="font-display bg-gradient-to-r from-cyan-100 via-amber-100 to-fuchsia-200 bg-clip-text text-4xl font-black uppercase tracking-[0.1em] text-transparent drop-shadow-[0_0_28px_rgba(34,211,238,0.35)] sm:text-5xl md:text-6xl md:tracking-[0.14em] lg:text-7xl"
            >
              Affiliate
            </h2>
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/45 bg-black/60 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.35),0_0_28px_rgba(6,182,212,0.15)] transition hover:border-cyan-300/70 hover:text-cyan-50 hover:shadow-[0_0_24px_rgba(34,211,238,0.45)] md:h-11 md:w-11"
              aria-expanded={helpOpen}
              aria-controls="affiliate-how-panel"
              title="How it works"
            >
              <HelpCircle className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
              <span className="sr-only">How affiliate login works</span>
            </button>
          </div>
          <p className="mx-auto mt-5 max-w-3xl px-1 text-justify text-[19px] font-medium leading-relaxed tracking-normal text-slate-200/95 sm:px-2 sm:text-[20px] md:mx-2 md:px-2 md:text-left md:text-xl md:leading-relaxed md:tracking-wide">
            Become a Syndicate affiliate: share your tracked links, earn when your audience joins and buys, and watch
            clicks, leads, and commissions in your partner dashboard. Built for operators who want leverage — not fluff.
          </p>
          <p className="mx-auto mt-4 max-w-3xl px-1 text-justify text-[17px] leading-relaxed text-slate-300/90 sm:px-2 sm:text-[18px] md:mx-2 md:px-2 md:text-left md:text-lg md:leading-relaxed">
            After you are approved as a partner, use the same email we have on file. You will get a one-time code (same
            luxury OTP experience as member login), then your stats and referral tools unlock instantly.
          </p>
        </div>

        {/* Coin — wheel spin on Y axis + neon rim glow */}
        <div
          className="hamburger-attract relative flex shrink-0 items-center justify-center self-center md:self-auto [perspective:900px]"
          aria-hidden
        >
          <div className="absolute inset-0 blur-3xl md:scale-110">
            <div className="mx-auto h-56 w-56 rounded-full bg-gradient-to-br from-amber-400/35 via-amber-500/20 to-amber-600/10 md:h-80 md:w-80 lg:h-96 lg:w-96" />
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
              width={384}
              height={384}
              className="relative h-52 w-52 object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.92)] sm:h-56 sm:w-56 md:h-72 md:w-72 lg:h-80 lg:w-80"
              sizes="(max-width: 640px) 208px, (max-width: 1024px) 288px, 320px"
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
              <li>Click &quot;Affiliate login&quot; (here or in the site menu).</li>
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

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:mt-8 md:justify-start">
          <Link
            href="/affiliate-login"
            className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-cyan-400/55 bg-gradient-to-b from-cyan-500/20 via-black/50 to-fuchsia-900/25 px-8 py-3.5 text-sm font-black uppercase tracking-[0.15em] text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.35),0_0_48px_rgba(217,70,239,0.12),0_12px_32px_rgba(0,0,0,0.75)] transition hover:border-fuchsia-300/50 hover:shadow-[0_0_32px_rgba(217,70,239,0.35),0_0_40px_rgba(34,211,238,0.25)] sm:text-base sm:tracking-[0.18em]"
          >
            Affiliate login
          </Link>      
        </div>
      </div>
    </section>
  )
}
