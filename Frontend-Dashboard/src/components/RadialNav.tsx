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

/**
 * Clockwise from top (user order):
 * 1 Home → 2 Membership → 3 Syn Diagnosis → 4 Our Founder → 5 Affiliate
 * → 6 Login → 7 Our Methods → 8 What You Get → 9 Syndicate Guarantee → 10 Programs
 */
export const RADIAL_SLOT_ORDER: readonly NavSectionId[] = [
  'home',
  'membership',
  'syndicateAnalysis',
  'ourFounder',
  'whatYouGet',
  'joinNow',
  'ourMethods',
  'syndicateGuarantee',
  'affiliate',
  'programs',
] as const

const defaultItems: RadialNavItem[] = RADIAL_SLOT_ORDER.map((id) => {
  const labels: Record<NavSectionId, string> = {
    home: 'Home',
    membership: 'Membership',
    syndicateAnalysis: 'Syn Diagnosis',
    ourFounder: 'Our Founder',
    affiliate: 'Affiliate',
    joinNow: 'Login',
    ourMethods: 'Our Methods',
    whatYouGet: 'What You Get',
    syndicateGuarantee: 'Refund',
    programs: 'Programs',
  }
  return { id, label: labels[id] }
})

const THEMES: Record<NavSectionId, { color: string; bg: string; border: string; glow: string }> = {
  home: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.5)', glow: 'rgba(96,165,250,0.42)' },
  whatYouGet: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.5)', glow: 'rgba(52, 210, 235, 0.4)' },
  ourMethods: { color: '#d946ef', bg: 'rgba(217,70,239,0.14)', border: 'rgba(217,70,239,0.5)', glow: 'rgba(217,70,239,0.4)' },
  ourFounder: {
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.14)',
    border: 'rgba(251,146,60,0.5)',
    glow: 'rgba(251,146,60,0.42)',
  },
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
  syndicateGuarantee: {
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.14)',
    border: 'rgba(168,85,247,0.55)',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  affiliate: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.5)',
    glow: 'rgba(52, 211, 153, 0.42)',
  },
}

/** Mobile + iPad (below lg) layout tweaks */
const RADIAL_NAV_COMPACT_MAX_WIDTH = 1024

/** Slot radius by viewport: smaller on mobile so buttons stay on screen */
function getSlotRadius(itemCount: number): number {
  if (typeof window === 'undefined') return itemCount >= 6 ? 185 : 205
  const w = window.innerWidth
  if (itemCount >= 7) {
    // Slightly larger radius so neon glows don't overlap neighboring pills.
    if (w < 360) return itemCount >= 10 ? 126 : 132
    if (w < 420) return itemCount >= 10 ? 138 : 144
    if (w < 480) return itemCount >= 10 ? 150 : 158
    if (w < 640) return itemCount >= 10 ? 172 : 182
    if (w < 768) return itemCount >= 10 ? 210 : 220
    if (w < RADIAL_NAV_COMPACT_MAX_WIDTH) return itemCount >= 10 ? 232 : 242
    return itemCount >= 10 ? 242 : 250
  }
  if (itemCount >= 6) {
    if (w < 380) return 100
    if (w < 480) return 118
    if (w < 640) return 134
    if (w < 768) return 158
    return 185
  }
  if (w < 380) return 92
  if (w < 480) return 118
  if (w < 640) return 155
  if (w < 768) return 175
  return 205
}

function getSlots(radius: number, count: number) {
  // Stronger vertical stretch on phones/iPads so Home↔Programs/Membership
  // and Our Methods/What You Get↔Login read as separate rows (not glow-stacked).
  let xScale = 1.06
  let yScale = 1.12
  if (typeof window !== 'undefined') {
    const w = window.innerWidth
    if (w < 420) {
      xScale = 1.08
      yScale = 1.58
    } else if (w < 640) {
      xScale = 1.07
      yScale = 1.48
    } else if (w < 768) {
      xScale = 1.06
      yScale = 1.4
    } else if (w < RADIAL_NAV_COMPACT_MAX_WIDTH) {
      xScale = 1.06
      yScale = 1.34
    } else {
      xScale = 1.05
      yScale = 1.08
    }
  }

  // Even ellipse, Home at top, then clockwise — mirrored left/right pairs share the same |y|.
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    return {
      x: radius * xScale * Math.cos(angle),
      y: radius * yScale * Math.sin(angle),
    }
  })
}

function slotIndexForId(id: NavSectionId, fallbackIndex: number): number {
  const idx = RADIAL_SLOT_ORDER.indexOf(id)
  return idx >= 0 ? idx : fallbackIndex
}

function getItemMargins(): { marginTop: string; marginBottom: string } {
  if (typeof window === 'undefined') return { marginTop: '12px', marginBottom: '12px' }
  const w = window.innerWidth
  if (w < 640) return { marginTop: '14px', marginBottom: '14px' }
  if (w < RADIAL_NAV_COMPACT_MAX_WIDTH) return { marginTop: '16px', marginBottom: '16px' }
  return { marginTop: '14px', marginBottom: '14px' }
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

  const orderedItems = useMemo(() => {
    const byId = new Map(items.map((it) => [it.id, it]))
    const ordered = RADIAL_SLOT_ORDER.map((id) => byId.get(id)).filter(Boolean) as RadialNavItem[]
    // Append any unexpected extras at the end (should not happen for marketing nav).
    for (const it of items) {
      if (!RADIAL_SLOT_ORDER.includes(it.id)) ordered.push(it)
    }
    return ordered.length ? ordered : items
  }, [items])

  const placed = useMemo(() => {
    const count = orderedItems.length
    return orderedItems.map((it, idx) => {
      const slot = slotIndexForId(it.id, idx)
      const baseAngleRad = (slot / count) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(baseAngleRad)
      const y = Math.sin(baseAngleRad)
      return { ...it, x, y, baseAngleRad, slot }
    })
  }, [orderedItems])
  const useCompactButtons = orderedItems.length >= 7

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return

    const root = rootRef.current
    const ctx = gsap.context(() => {
      const backdrop = root.querySelector('[data-rnav="backdrop"]')
      const ring = root.querySelector('[data-rnav="ring"]')
      const items = root.querySelectorAll('[data-rnav="item"]')
      if (backdrop) gsap.set(backdrop, { autoAlpha: 0 })
      if (ring) gsap.set(ring, { rotate: 0, transformOrigin: '50% 50%' })
      if (items.length) gsap.set(items, { autoAlpha: 0 })
    }, root)

    return () => ctx.revert()
  }, [open])

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
      return
    }

    if (prefersReducedMotion) {
      const n = orderedItems.length
      const slots = getSlots(getSlotRadius(n), n)
      const backdrop = rootRef.current.querySelector('[data-rnav="backdrop"]')
      if (backdrop) gsap.set(backdrop, { autoAlpha: 1 })
      rootRef.current.querySelectorAll<HTMLElement>('[data-rnav="item"]').forEach((el) => {
        const id = el.dataset.rnavId as NavSectionId | undefined
        const slotIdx = id ? slotIndexForId(id, 0) : 0
        const slot = slots[slotIdx % slots.length]
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

    const n = orderedItems.length
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

    const backdrop = rootRef.current.querySelector('[data-rnav="backdrop"]')
    const center = rootRef.current.querySelector('[data-rnav="center"]')

    tlRef.current = gsap.timeline({ defaults: { ease: 'power2.out' } })
    if (backdrop) {
      tlRef.current.to(backdrop, { autoAlpha: 1, duration: 0.32 })
    }
    if (center) {
      tlRef.current.fromTo(
        center,
        { scale: 0.85, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.42 },
        0,
      )
    }
    if (nodes.length) {
      tlRef.current.to(
        nodes,
        {
          xPercent: -50,
          yPercent: -50,
          x: (_i, el) => {
            const id = (el as HTMLElement).dataset.rnavId as NavSectionId | undefined
            const slotIdx = id ? slotIndexForId(id, 0) : 0
            return slots[slotIdx % slots.length]?.x ?? 0
          },
          y: (_i, el) => {
            const id = (el as HTMLElement).dataset.rnavId as NavSectionId | undefined
            const slotIdx = id ? slotIndexForId(id, 0) : 0
            return slots[slotIdx % slots.length]?.y ?? 0
          },
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
    }

    glowRef.current?.kill()
    glowRef.current = null

    return
  }, [open, prefersReducedMotion, placed, orderedItems.length])

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
      .to(rootRef.current.querySelector('[data-rnav="backdrop"]'), { autoAlpha: 0, duration: 0.24 }, 0)
      .to(
        rootRef.current.querySelectorAll('[data-rnav="item"]'),
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
          ? 'pointer-events-none fixed inset-0 z-[400]'
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
              className="relative h-full min-h-[260px] max-h-[58vh] w-[min(94vw,360px)] max-w-[360px] sm:min-h-[44vh] sm:max-h-[56vh] md:max-w-[400px] md:max-h-[54vh] lg:min-h-[38vh] lg:max-h-[42vh] lg:w-[min(92vw,340px)] lg:max-w-[340px]"
            >
              <div
                data-rnav="ring"
                className="absolute inset-0"
                style={{ transformOrigin: '50% 50%' }}
              >
                {placed.map((it) => {
                  const theme = THEMES[it.id] ?? THEMES.home
                  return (
                    <div
                      key={it.id}
                      data-rnav="item"
                      data-rnav-id={it.id}
                      data-rnav-slot={it.slot}
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
                          useCompactButtons ? 'mx-[5px] sm:mx-1' : 'mx-0.5',
                          'rounded-lg border-2 px-3.5 py-2.5 overflow-visible',
                          it.id === 'syndicateGuarantee'
                            ? 'text-[10px] font-bold uppercase tracking-[0.06em] whitespace-normal text-center leading-tight sm:text-[11px]'
                            : 'text-[12px] font-bold uppercase tracking-[0.1em] whitespace-nowrap',
                          useCompactButtons
                            ? 'sm:min-w-[138px] sm:px-3.5 sm:py-2.5 sm:text-[12px]'
                            : 'sm:min-w-[160px] sm:px-4 sm:py-2.5 sm:text-[13px]',
                          'transition-[filter,box-shadow] duration-500 ease-in-out',
                        ].join(' ')}
                        style={{
                          ...getItemMargins(),
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
