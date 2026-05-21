'use client'

import Link from 'next/link'
import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { MARKETING_NAV_HREF } from '@/lib/marketing-nav-routes'
import { ScrambleText } from './ScrambleText'
import NavLogo from './NavLogo'

export type { NavSectionId } from '@/lib/marketing-nav-routes'
import type { NavSectionId } from '@/lib/marketing-nav-routes'

export type RadialNavItem = {
  id: NavSectionId
  label: string
}

export type RadialNavProps = {
  open: boolean
  /** When true, play assemble (cards to center) animation then call onClose */
  closing?: boolean
  items?: RadialNavItem[]
  activeId?: NavSectionId
  onClose: () => void
  onSelect: (id: NavSectionId) => void
  onPrefetch?: (id: NavSectionId) => void
}

const defaultItems: RadialNavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'whatYouGet', label: 'What You Get' },
  { id: 'ourMethods', label: 'Our Methods' },
  { id: 'syndicateAnalysis', label: 'Syn Diagnosis' },
  { id: 'joinNow', label: 'Login' },
  { id: 'programs', label: 'Programs' },
  { id: 'membership', label: 'Membership' },
  { id: 'affiliate', label: 'Affiliate' },
]

const THEMES: Record<NavSectionId, { color: string; bg: string; border: string; glow: string }> = {
  home: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.5)', glow: 'rgba(96,165,250,0.42)' },
  whatYouGet: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.5)', glow: 'rgba(52, 210, 235, 0.4)' },
  ourMethods: { color: '#d946ef', bg: 'rgba(217,70,239,0.14)', border: 'rgba(217,70,239,0.5)', glow: 'rgba(217,70,239,0.4)' },
  syndicateAnalysis: {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.5)',
    glow: 'rgba(34,197,94,0.42)',
  },
  joinNow: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.5)', glow: 'rgba(248, 191, 47, 0.4)' },
  programs: { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(208, 70, 243, 0.5)', glow: 'rgba(218, 114, 244, 0.4)' },
  membership: {
    color: '#fda4af',
    bg: 'rgba(253,164,175,0.12)',
    border: 'rgba(253,164,175,0.5)',
    glow: 'rgba(251, 113, 133, 0.42)',
  },
  affiliate: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.5)',
    glow: 'rgba(52, 211, 153, 0.42)',
  },
}

/** Slot radius by viewport: smaller on mobile so buttons stay on screen */
function getSlotRadius(itemCount: number): number {
  if (typeof window === 'undefined') return itemCount >= 6 ? 175 : 195
  const w = window.innerWidth
  if (itemCount >= 7) {
    // Fold / narrow-mobile: tighten horizontal spread without changing layout.
    if (w < 360) return 114
    if (w < 420) return 124
    if (w < 480) return 136
    if (w < 640) return 160
    if (w < 768) return 198
    return 236
  }
  if (itemCount >= 6) {
    if (w < 380) return 92
    if (w < 480) return 108
    if (w < 640) return 124
    if (w < 768) return 148
    return 175
  }
  if (w < 380) return 85
  if (w < 480) return 110
  if (w < 640) return 145
  if (w < 768) return 165
  return 195
}

function getSlots(radius: number, count: number) {
  let xScale = 1
  let yScale = 1
  if (typeof window !== 'undefined' && count >= 7) {
    const w = window.innerWidth
    if (w < 420) {
      // Fold / narrow-mobile: add more vertical breathing room between rows.
      // Keep horizontal separation so bottom cards don't touch.
      xScale = 1
      yScale = 1.24
    } else if (w < 640) {
      xScale = 0.98
      yScale = 1.1
    }
  }
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    let x = radius * xScale * Math.cos(angle)
    let y = radius * yScale * Math.sin(angle)
    if (typeof window !== 'undefined' && count >= 7 && window.innerWidth < 420) {
      // Mobile/Fold: keep a visible gap between the bottom pair
      // (`joinNow` index 4 and `syndicateAnalysis` index 3).
      if (i === 3) x += 8
      if (i === 4) x -= 8
    }
    return {
      x,
      y,
    }
  })
}

function getMobileItemNudge(id: NavSectionId, itemCount: number): {
  marginLeft?: string;
  marginRight?: string;
  marginTop?: string;
  marginBottom?: string;
} {
  if (typeof window === 'undefined' || itemCount < 7) return {}
  const w = window.innerWidth
  // Keep extra breathing room on narrow phones + iPhone 15 Pro Max style widths.
  if (w >= 460) return {}
  if (id === 'home') return { marginBottom: '22px' }
  if (id === 'affiliate' || id === 'whatYouGet') return { marginTop: '22px' }
  // Most visible collapse happens on the last pair; separate them further.
  if (id === 'joinNow') return { marginRight: '26px' }
  if (id === 'syndicateAnalysis') return { marginLeft: '26px' }
  return {}
}

export function RadialNav({
  open,
  closing = false,
  items = defaultItems,
  activeId,
  onClose,
  onSelect,
  onPrefetch,
}: RadialNavProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const glowRef = useRef<gsap.core.Tween | null>(null)

  const placed = useMemo(() => {
    const count = items.length
    return items.map((it, idx) => {
      const baseAngleRad = (idx / count) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(baseAngleRad)
      const y = Math.sin(baseAngleRad)
      return { ...it, x, y, baseAngleRad }
    })
  }, [items])
  const useCompactButtons = items.length >= 7

  useLayoutEffect(() => {
    if (!rootRef.current) return

    const ctx = gsap.context(() => {
      gsap.set('[data-rnav="backdrop"]', { autoAlpha: 0 })
      gsap.set('[data-rnav="ring"]', { rotate: 0, transformOrigin: '50% 50%' })
      gsap.set('[data-rnav="item"]', { autoAlpha: 0 })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    if (!rootRef.current) return
    if (prefersReducedMotion) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, prefersReducedMotion])

  useLayoutEffect(() => {
    if (!rootRef.current) return

    if (!open) {
      tlRef.current?.kill()
      glowRef.current?.kill()
      gsap.set('[data-rnav="backdrop"]', { autoAlpha: 0 })
      gsap.set('[data-rnav="item"]', { autoAlpha: 0 })
      return
    }

    if (prefersReducedMotion) {
      const n = items.length
      const slots = getSlots(getSlotRadius(n), n)
      gsap.set('[data-rnav="backdrop"]', { autoAlpha: 1 })
      rootRef.current.querySelectorAll<HTMLElement>('[data-rnav="item"]').forEach((el, i) => {
        const slot = slots[i % slots.length]
        if (!slot) return
        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          x: slot.x,
          y: slot.y,
          scale: 1,
          rotate: 0,
          autoAlpha: 1,
        })
      })
      return
    }

    tlRef.current?.kill()
    glowRef.current?.kill()

    const nodes = rootRef.current.querySelectorAll<HTMLElement>('[data-rnav="item"]')
    const logoEl = document.querySelector<HTMLElement>('[data-logo="gun"]')
    const centerEl = rootRef.current.querySelector<HTMLElement>('[data-rnav="center"]')

    let startX = 0
    let startY = 0

    if (logoEl && centerEl) {
      const logoRect = logoEl.getBoundingClientRect()
      const centerRect = centerEl.getBoundingClientRect()
      const logoCx = logoRect.left + logoRect.width / 2
      const logoCy = logoRect.top + logoRect.height / 2
      const centerCx = centerRect.left + centerRect.width / 2
      const centerCy = centerRect.top + centerRect.height / 2

      startX = logoCx - centerCx
      startY = logoCy - centerCy
    }

    const n = items.length
    const slots = getSlots(getSlotRadius(n), n)

    nodes.forEach((el) => {
      gsap.set(el, {
        xPercent: -50,
        yPercent: -50,
        x: startX,
        y: startY,
        scale: 0.35,
        rotate: 0,
        autoAlpha: 0.4,
        transformOrigin: '50% 50%',
      })
    })

    tlRef.current = gsap
      .timeline({ defaults: { ease: 'power2.out' } })
      .to('[data-rnav="backdrop"]', { autoAlpha: 1, duration: 0.32 })
      .fromTo(
        '[data-rnav="center"]',
        { scale: 0.85, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.42 },
        0,
      )
      .to(
        '[data-rnav="item"]',
        {
          xPercent: -50,
          yPercent: -50,
          x: (i) => slots[i % slots.length]?.x ?? 0,
          y: (i) => slots[i % slots.length]?.y ?? 0,
          scale: 1,
          rotate: 0,
          autoAlpha: 1,
          duration: 0.32,
          stagger: 0.04,
          ease: 'power3.out',
          overwrite: true,
        },
        0.12,
      )

    glowRef.current?.kill()
    glowRef.current = null

    return
  }, [open, prefersReducedMotion, placed, items.length])

  // When cursor leaves section: cards assemble to center, then close
  useLayoutEffect(() => {
    if (!closing || !open || !rootRef.current) return
    if (prefersReducedMotion) {
      onClose()
      return
    }

    glowRef.current?.kill()

    const logoEl = document.querySelector<HTMLElement>('[data-logo="gun"]')
    const centerEl = rootRef.current.querySelector<HTMLElement>('[data-rnav="center"]')

    let endX = 0
    let endY = 0

    if (logoEl && centerEl) {
      const logoRect = logoEl.getBoundingClientRect()
      const centerRect = centerEl.getBoundingClientRect()
      const logoCx = logoRect.left + logoRect.width / 2
      const logoCy = logoRect.top + logoRect.height / 2
      const centerCx = centerRect.left + centerRect.width / 2
      const centerCy = centerRect.top + centerRect.height / 2

      endX = logoCx - centerCx
      endY = logoCy - centerCy
    }

    gsap
      .timeline({
        onComplete: onClose,
      })
      .to('[data-rnav="backdrop"]', { autoAlpha: 0, duration: 0.24 }, 0)
      .to(
        '[data-rnav="item"]',
        {
          xPercent: -50,
          yPercent: -50,
          x: endX,
          y: endY,
          scale: 0.35,
          rotate: 0,
          autoAlpha: 0.5,
          duration: 0.52,
          stagger: 0.04,
          ease: 'power2.inOut',
          overwrite: true,
        },
        0,
      )
  }, [closing, open, onClose, prefersReducedMotion])

  return (
    <div
      ref={rootRef}
      className={
        open
          ? 'pointer-events-none fixed inset-0 z-50'
          : 'pointer-events-none fixed inset-0 h-0 overflow-hidden opacity-0'
      }
      aria-hidden={!open}
    >
      {open && (
        <>
          <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0d0618]/92" aria-hidden />

          <button
            type="button"
            data-rnav="backdrop"
            className="pointer-events-auto absolute inset-0 bg-black/55"
            onClick={onClose}
            aria-label="Close menu"
          />

          {/* Top bar: logo (how to get in) + close X (how to get out) */}
          <div className="pointer-events-auto absolute left-0 right-0 top-0 z-[60] flex h-14 items-center justify-between px-4 sm:h-16 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center"
              aria-label="Close menu"
            >
              <NavLogo />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="hamburger-attract flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-amber-300/70 bg-black/55 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.22)] transition-colors sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="absolute inset-0 grid place-items-center overflow-visible p-3 sm:p-4">
            <div
              data-rnav="center"
              className="relative h-full min-h-[220px] max-h-[42vh] w-[min(92vw,340px)] max-w-[340px] sm:min-h-[38vh]"
            >
              <div
                data-rnav="ring"
                className="absolute inset-0"
                style={{ transformOrigin: '50% 50%' }}
              >
                {placed.map((it) => {
                  const theme = THEMES[it.id]
                  return (
                    <div
                      key={it.id}
                      data-rnav="item"
                      className="absolute left-1/2 top-1/2 pointer-events-none overflow-visible"
                      style={{ transformOrigin: '50% 50%' }}
                    >
                      <Link
                        href={MARKETING_NAV_HREF[it.id]}
                        prefetch
                        onPointerEnter={() => onPrefetch?.(it.id)}
                        onFocus={() => onPrefetch?.(it.id)}
                        onClick={(e) => {
                          e.preventDefault()
                          onSelect(it.id)
                        }}
                        className={[
                          'nav-card-lightning pointer-events-auto cursor-pointer relative z-10 inline-flex items-center justify-center',
                          useCompactButtons
                            ? 'min-w-[104px] max-w-[min(188px,84vw)]'
                            : 'min-w-[136px] max-w-[min(220px,88vw)]',
                          // Mobile/Fold: keep a small visual gap between neighboring pills.
                          useCompactButtons ? 'mx-[2.5px] sm:mx-0' : '',
                          'rounded-lg border-2 px-3.5 py-2.5 overflow-visible',
                          'text-[12px] font-bold uppercase tracking-[0.1em] whitespace-nowrap',
                          useCompactButtons
                            ? 'sm:min-w-[138px] sm:px-3.5 sm:py-2.5 sm:text-[12px]'
                            : 'sm:min-w-[160px] sm:px-4 sm:py-2.5 sm:text-[13px]',
                          'transition-[filter,box-shadow] duration-500 ease-in-out',
                        ].join(' ')}
                        style={{
                          ...getMobileItemNudge(it.id, items.length),
                          color: theme.color,
                          backgroundColor: theme.bg,
                          borderColor: activeId === it.id ? 'rgba(255,255,255,0.9)' : theme.border,
                          boxShadow:
                            activeId === it.id
                              ? `0 0 16px rgba(255,255,255,0.32), 0 0 30px ${theme.glow}, inset 0 0 8px ${theme.glow}`
                              : `0 0 12px ${theme.glow}, inset 0 0 6px ${theme.glow}`,
                          textShadow: '0 0 10px rgba(255,255,255,0.3)',
                          transition: 'border-color 280ms ease, box-shadow 280ms ease',
                        }}
                      >
                        <ScrambleText
                          text={it.label}
                          charset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                          runOnMount={false}
                        />
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
