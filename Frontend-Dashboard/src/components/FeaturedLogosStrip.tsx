'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'

type FeaturedLogo = {
  src: string
  alt: string
  href?: string
}

type FeaturedLogosStripProps = {
  logos: FeaturedLogo[]
  speedSeconds?: number
  compact?: boolean
  className?: string
}

export default function FeaturedLogosStrip({ logos, speedSeconds = 24, compact = false, className }: FeaturedLogosStripProps) {
  const safeLogos = useMemo(
    () => logos.filter((logo) => logo.src.trim().length > 0 && logo.alt.trim().length > 0),
    [logos],
  )
  // Triple each half so ultra-wide hero/footer never shows an empty gap before the loop resets.
  const trackLogos = useMemo(() => {
    const half = [...safeLogos, ...safeLogos, ...safeLogos]
    return [...half, ...half]
  }, [safeLogos])
  const stripRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLElement | null>>([])
  const centerGap = compact ? 'min(400px, 68vw)' : 'min(400px, 42vw)'
  const centerBlurWidth = compact ? 'clamp(54px, 9vw, 90px)' : 'clamp(72px, 8vw, 124px)'
  const itemGap = compact ? '1.25rem' : '2rem'

  useEffect(() => {
    const root = stripRef.current
    if (!root || compact) return

    const updateScales = () => {
      const rect = root.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerGapPx = Math.min(400, rect.width * (compact ? 0.68 : 0.42))
      const halfGap = centerGapPx / 2
      const blurBand = compact ? Math.max(42, rect.width * 0.08) : Math.max(58, rect.width * 0.08)

      const leftZoneStart = centerX - halfGap - blurBand
      const leftZoneEnd = centerX - halfGap
      const rightZoneStart = centerX + halfGap
      const rightZoneEnd = centerX + halfGap + blurBand

      itemRefs.current.forEach((el) => {
        if (!el) return
        const logoRect = el.getBoundingClientRect()
        const logoMidX = logoRect.left - rect.left + logoRect.width / 2
        const insideBlurZone =
          (logoMidX >= leftZoneStart && logoMidX <= leftZoneEnd) ||
          (logoMidX >= rightZoneStart && logoMidX <= rightZoneEnd)

        el.style.transform = insideBlurZone ? 'scale(1.055)' : 'scale(1)'
      })
    }

    updateScales()
    const timer = window.setInterval(updateScales, 110)
    window.addEventListener('resize', updateScales)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('resize', updateScales)
    }
  }, [compact, trackLogos.length])

  if (safeLogos.length === 0) return null

  return (
    <section
      className={[
        'testimonials-cyber-section relative overflow-hidden',
        compact ? 'py-3 sm:py-4' : 'py-8 sm:py-10',
        className ?? '',
      ].join(' ')}
      aria-label="Featured logos"
    >
      <div className="pointer-events-none absolute inset-0 z-20 px-3 sm:px-5">
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 top-0 h-px bg-amber-300/90" />
          <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-amber-200/18 to-transparent blur-md" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-amber-300/90" />
          <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-amber-200/18 to-transparent blur-md" />
        </div>
      </div>

      <div
        ref={stripRef}
        className="relative w-full overflow-hidden"
        style={{ ['--center-gap' as string]: centerGap, ['--center-blur-width' as string]: centerBlurWidth }}
      >
        <div className="logos-side-fade logos-side-fade-left" />
        <div className="logos-side-fade logos-side-fade-right" />
        <div
          className={[
            'featured-logos-marquee-track items-center',
            compact ? 'py-1.5 sm:py-2' : 'py-4 sm:py-5',
          ].join(' ')}
          style={{
            ['--duration' as string]: `${speedSeconds}s`,
            gap: itemGap,
          }}
        >
          {trackLogos.map((logo, index) => (
            <article
              key={`${logo.src}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              className={[
                'flex shrink-0 items-center justify-center rounded-xl border border-amber-300/45 bg-[#030811]/78 shadow-[0_0_20px_rgba(251,191,36,0.08)] backdrop-blur-[2px] transition-transform duration-300 ease-out',
                compact ? 'px-3 py-1 sm:px-3.5 sm:py-1.5' : 'px-4 py-2.5 sm:px-5 sm:py-3',
              ].join(' ')}
              style={compact
                ? { minWidth: 'clamp(66px, 11vw, 92px)', height: 'clamp(30px, 5vw, 40px)' }
                : { minWidth: 'clamp(120px, 22vw, 156px)', height: 'clamp(66px, 12vw, 86px)' }}
            >
              {logo.href ? (
                <a href={logo.href} target="_blank" rel="noreferrer" aria-label={logo.alt} className="inline-flex">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={compact ? 104 : 188}
                    height={compact ? 30 : 66}
                    loading="lazy"
                    quality={70}
                    sizes={compact ? "104px" : "188px"}
                    className="w-auto object-contain opacity-95 transition-all duration-300 hover:opacity-100"
                    style={compact ? { height: 'clamp(14px, 2.7vw, 20px)' } : { height: 'clamp(30px, 6vw, 50px)' }}
                  />
                </a>
              ) : (
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={compact ? 104 : 188}
                  height={compact ? 30 : 66}
                  loading="lazy"
                  quality={70}
                  sizes={compact ? "104px" : "188px"}
                  className="w-auto object-contain opacity-95"
                  style={compact ? { height: 'clamp(14px, 2.7vw, 20px)' } : { height: 'clamp(30px, 6vw, 50px)' }}
                />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
