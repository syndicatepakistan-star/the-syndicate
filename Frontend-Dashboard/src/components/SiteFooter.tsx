import Image from 'next/image'
import Link from 'next/link'
import LetterGlitch from '@/components/LetterGlitch'
import NeonTypingBadge from '@/components/NeonTypingBadge'

const footerLinkClass =
  'relative inline-flex pb-1 transition duration-300 ease-out hover:scale-105 hover:brightness-110 focus-visible:scale-105 focus-visible:outline-none after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-amber-200/90 after:shadow-[0_0_10px_rgba(251,191,36,0.45)] after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100'

const socialIconClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/60 bg-black/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)] transition duration-300 ease-out hover:scale-110 hover:text-amber-100 hover:shadow-[0_0_18px_rgba(251,191,36,0.42)] focus-visible:scale-110 focus-visible:outline-none'

type SiteFooterProps = {
  sloganTypingSpeed?: number;
  sloganDeletingSpeed?: number;
  sloganPauseMs?: number;
};

export default function SiteFooter({
  sloganTypingSpeed,
  sloganDeletingSpeed,
  sloganPauseMs,
}: SiteFooterProps = {}) {
  return (
    <footer
      className="relative min-h-[clamp(260px,34vh,300px)] w-full overflow-hidden border-t bg-[#02050b] px-[clamp(1rem,3vw,2rem)] py-[clamp(2rem,5vw,3.75rem)]"
      style={{
        borderColor: 'rgba(251, 191, 36, 0.6)',
        boxShadow: 'inset 0 1px 0 rgba(251, 191, 36, 0.28), 0 -8px 30px rgba(251, 191, 36, 0.12)',
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <LetterGlitch
          glitchSpeed={70}
          centerVignette
          outerVignette
          smooth
          glitchColors={['#4a2b72', '#61dca3', '#61b3dc']}
          layerOpacity={0.8}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-black/62" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[min(1700px,97vw)] flex-col gap-[clamp(1.7rem,4vw,3.25rem)]">
        {/* Logo + slogan + quick links: one row on md, vertically centered to the same row height (footer vh band). */}
        <div className="grid grid-cols-1 items-center justify-items-center gap-[clamp(0.6rem,1.2vw,1.15rem)] md:grid-cols-[auto_auto_minmax(0,1fr)] md:items-center md:justify-items-stretch md:gap-x-0 md:gap-y-[clamp(1rem,3vw,2.25rem)]">
          <div className="justify-self-center md:min-w-0 md:justify-self-start md:self-center md:pr-1">
            <Image
              src="/assets/logo.webp"
              alt="syndicate logo"
              width={360}
              height={120}
              className="hamburger-attract h-[clamp(5.2rem,11vw,8.5rem)] w-auto object-contain"
              priority={false}
            />
          </div>

          <div className="flex min-w-0 w-full max-w-[min(96vw,56rem)] justify-center self-center px-[clamp(0.25rem,1vw,0.75rem)] py-[clamp(0.25rem,1vw,0.6rem)] text-center md:ml-[150px] md:w-auto md:max-w-[min(96vw,56rem)] md:justify-self-center md:px-[clamp(0.35rem,1.2vw,0.75rem)] md:py-0">
            <NeonTypingBadge
              phrases={['HONOUR · MONEY · POWER · FREEDOM']}
              typingSpeed={sloganTypingSpeed ?? 24}
              deletingSpeed={sloganDeletingSpeed ?? 24}
              pauseMs={sloganPauseMs ?? 420}
              boxed={false}
              className="footer-typing"
            />
          </div>

          <div className="w-full max-w-[min(20rem,92vw)] justify-self-center rounded-xl p-[clamp(0.4rem,1vw,0.75rem)] text-center md:min-w-0 md:max-w-[min(36rem,100%)] md:justify-self-end md:self-center md:shrink-0 md:pl-6 md:pr-0 md:text-right">
            <p
              className="text-sm font-semibold uppercase tracking-[0.22em] sm:text-base"
              style={{ color: 'rgba(253, 230, 138, 0.95)', textShadow: '0 0 10px rgba(251, 191, 36, 0.35)' }}
            >
              Quick Links
            </p>
            <nav
              aria-label="Quick links"
              className="mt-3 grid max-sm:grid-cols-1 grid-cols-2 gap-x-[clamp(0.85rem,2.2vw,2rem)] gap-y-2.5 text-[clamp(0.82rem,1.25vw,1.05rem)] font-semibold leading-snug max-sm:justify-items-center sm:gap-y-2 md:justify-items-end sm:[&>a:last-child]:col-span-2 sm:[&>a:last-child]:justify-self-end"
            >
              <Link href="/" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Home</Link>
              <Link href="/what-you-get" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>What You Get</Link>
              <Link href="/our-methods" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Our Methods</Link>
              <Link href="/programs" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Programs</Link>
              <Link href="/quiz" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Syn Diagnosis</Link>
              <Link href="/affiliate" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Affiliate</Link>
              <Link href="/membership" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Membership</Link>
              <Link href="/login" prefetch className={`${footerLinkClass} whitespace-nowrap`} style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Join Now</Link>
            </nav>
            <div className="mt-3 flex items-center justify-center gap-3 md:justify-end">
              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.7V8.3L15.8 12l-6.2 3.7Z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/followthesyndicate?igsh=MXV5b3E5NnF4YWxjNg==" target="_blank" rel="noreferrer" aria-label="Instagram" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.1.1 1.7.2 2.1.4.6.2 1 .4 1.5.9s.7.9.9 1.5c.2.4.3 1 .4 2.1.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.1-.2 1.7-.4 2.1-.2.6-.4 1-.9 1.5s-.9.7-1.5.9c-.4.2-1 .3-2.1.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.1-.1-1.7-.2-2.1-.4-.6-.2-1-.4-1.5-.9s-.7-.9-.9-1.5c-.2-.4-.3-1-.4-2.1C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.1.2-1.7.4-2.1.2-.6.4-1 .9-1.5s.9-.7 1.5-.9c.4-.2 1-.3 2.1-.4 1.2-.1 1.6-.1 4.8-.1Zm0 2.2c-3.1 0-3.5 0-4.7.1-.8 0-1.3.2-1.6.3-.4.1-.7.3-1 .6-.3.3-.5.6-.6 1-.1.3-.2.8-.3 1.6-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 .8.2 1.3.3 1.6.1.4.3.7.6 1 .3.3.6.5 1 .6.3.1.8.2 1.6.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c.8 0 1.3-.2 1.6-.3.8-.3 1.4-.9 1.7-1.7.1-.3.2-.8.3-1.6.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-.8-.2-1.3-.3-1.6-.1-.4-.3-.7-.6-1-.3-.3-.6-.5-1-.6-.3-.1-.8-.2-1.6-.3-1.2-.1-1.6-.1-4.7-.1Zm0 3.7A3.9 3.9 0 1 1 12 16a3.9 3.9 0 0 1 0-7.8Zm0 5.6a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Zm5-6.8a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Z" />
                </svg>
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M13.7 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.5 1.6-1.5H17V4.1c-.8-.1-1.6-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H8v3.2h2.7V22h3Z" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@followthesyndicate?_r=1&_t=ZG-95id6R01vZh" target="_blank" rel="noreferrer" aria-label="TikTok" className={socialIconClass}>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden>
                  <path d="M14.6 2h2.8c.2 1.8 1.3 3.4 3 4.3V9a7.5 7.5 0 0 1-3-.8v6.6a6 6 0 1 1-6-6h.3v2.8h-.3a3.2 3.2 0 1 0 3.2 3.2V2Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <p
          className="border-t pt-[clamp(1rem,2.3vw,1.5rem)] text-center text-[10px] tracking-[0.13em] sm:text-xs"
          style={{ borderColor: 'rgba(251, 191, 36, 0.45)', color: 'rgba(254, 243, 199, 0.85)', textShadow: '0 0 8px rgba(251, 191, 36, 0.2)' }}
        >
          All content is made for educational purposes and is up to the individual to apply the knowledge. We do not guarantee any results.
        </p>
      </div>
    </footer>
  )
}

