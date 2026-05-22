'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useGesture } from '@use-gesture/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type ImageItem = string | { src: string; alt?: string; href?: string }

type DomeGalleryProps = {
  images?: ImageItem[]
  fit?: number
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height'
  minRadius?: number
  maxRadius?: number
  padFactor?: number
  overlayBlurColor?: string
  maxVerticalRotationDeg?: number
  dragSensitivity?: number
  enlargeTransitionMs?: number
  segments?: number
  dragDampening?: number
  openedImageWidth?: string
  openedImageHeight?: string
  imageBorderRadius?: string
  openedImageBorderRadius?: string
  grayscale?: boolean
  autoRotateSpeedDeg?: number
  tileInsetPx?: number
  /** When set, every tile navigates to this URL instead of enlarging. */
  clickHref?: string
  /** When true, tiles with per-image `href` navigate on click; others enlarge. */
  navigateOnClick?: boolean
}

type ItemDef = {
  src: string
  alt: string
  href?: string
  x: number
  y: number
  sizeX: number
  sizeY: number
}

const DEFAULT_IMAGES: ImageItem[] = [
  { src: '/assets/kings.png', alt: 'Featured program one' },
  { src: '/assets/pawn.png', alt: 'Featured program two' },
  { src: '/assets/kings3.png', alt: 'Featured program three' },
  { src: '/assets/pawn.png', alt: 'Featured program four' },
  { src: '/assets/pawn1.png', alt: 'Featured program five' },
  { src: '/assets/pawn2.png', alt: 'Featured program six' },
  { src: '/assets/coin-gold.png', alt: 'Featured program seven' },
]

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360
  return a - 180
}
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`)
  const n = attr == null ? Number.NaN : parseFloat(attr)
  return Number.isFinite(n) ? n : fallback
}

function buildItems(pool: ImageItem[], seg: number): ItemDef[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
  const evenYs = [-4, -2, 0, 2, 4]
  const oddYs = [-3, -1, 1, 3, 5]

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }))
  })

  const totalSlots = coords.length
  const normalizedImages = pool.length
    ? pool.map((image) =>
        typeof image === 'string'
          ? { src: image, alt: '', href: undefined }
          : { src: image.src || '', alt: image.alt || '', href: image.href }
      )
    : [{ src: '', alt: '', href: undefined }]
  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]!)

  for (let i = 1; i < usedImages.length; i += 1) {
    if (usedImages[i]?.src === usedImages[i - 1]?.src) {
      for (let j = i + 1; j < usedImages.length; j += 1) {
        if (usedImages[j]?.src !== usedImages[i]?.src) {
          const tmp = usedImages[i]
          usedImages[i] = usedImages[j]!
          usedImages[j] = tmp!
          break
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i]?.src ?? '',
    alt: usedImages[i]?.alt ?? '',
    href: usedImages[i]?.href,
  }))
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
  const unit = 360 / segments / 2
  const rotateY = unit * (offsetX + (sizeX - 1) / 2)
  const rotateX = unit * (offsetY - (sizeY - 1) / 2)
  return { rotateX, rotateY }
}

export default function DomeGallery({
  images = DEFAULT_IMAGES,
  fit = 0.5,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Number.POSITIVE_INFINITY,
  padFactor = 0.25,
  overlayBlurColor = '#120F17',
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth = '400px',
  openedImageHeight = '400px',
  imageBorderRadius = '30px',
  openedImageBorderRadius = '30px',
  grayscale = true,
  autoRotateSpeedDeg = 2,
  tileInsetPx = 14,
  clickHref,
  navigateOnClick = false,
}: DomeGalleryProps) {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const focusedElRef = useRef<HTMLElement | null>(null)
  const originalTilePositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null)

  const rotationRef = useRef({ x: 0, y: 0 })
  const startRotRef = useRef({ x: 0, y: 0 })
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)
  const cancelTapRef = useRef(false)
  const movedRef = useRef(false)
  const inertiaRAF = useRef<number | null>(null)
  const autoRotateRAF = useRef<number | null>(null)
  const autoRotateLastTs = useRef<number | null>(null)
  const pointerTypeRef = useRef<'mouse' | 'pen' | 'touch'>('mouse')
  const tapTargetRef = useRef<HTMLElement | null>(null)
  const openingRef = useRef(false)
  const openStartedAtRef = useRef(0)
  const lastDragEndAt = useRef(0)
  const activeSegmentsRef = useRef(segments)
  const [activeSegments, setActiveSegments] = useState(segments)

  const scrollLockedRef = useRef(false)
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return
    scrollLockedRef.current = true
    document.body.classList.add('dg-scroll-lock')
  }, [])
  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return
    if (rootRef.current?.getAttribute('data-enlarging') === 'true') return
    scrollLockedRef.current = false
    document.body.classList.remove('dg-scroll-lock')
  }, [])

  const items = useMemo(() => buildItems(images, activeSegments), [images, activeSegments])

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
    }
  }

  const lockedRadiusRef = useRef<number | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      const w = Math.max(1, cr.width)
      const h = Math.max(1, cr.height)
      const isMobile = w < 640
      const nextSegments = isMobile ? Math.max(10, Math.round(segments * 0.56)) : segments
      activeSegmentsRef.current = nextSegments
      setActiveSegments((prev) => (prev === nextSegments ? prev : nextSegments))
      const minDim = Math.min(w, h)
      const maxDim = Math.max(w, h)
      const aspect = w / h
      let basis: number
      switch (fitBasis) {
        case 'min':
          basis = minDim
          break
        case 'max':
          basis = maxDim
          break
        case 'width':
          basis = w
          break
        case 'height':
          basis = h
          break
        default:
          basis = aspect >= 1.3 ? w : minDim
      }
      let radius = basis * fit
      radius = Math.min(radius, h * 1.35)
      const effectiveMinRadius = minRadius
      radius = clamp(radius, effectiveMinRadius, maxRadius)
      lockedRadiusRef.current = Math.round(radius)

      const viewerPad = Math.max(8, Math.round(minDim * padFactor))
      const effectiveTileInsetPx = isMobile ? Math.max(8, Math.round(tileInsetPx * 0.62)) : tileInsetPx
      root.style.setProperty('--segments-x', `${nextSegments}`)
      root.style.setProperty('--segments-y', `${nextSegments}`)
      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`)
      root.style.setProperty('--viewer-pad', `${viewerPad}px`)
      root.style.setProperty('--tile-inset', `${effectiveTileInsetPx}px`)
      root.style.setProperty('--overlay-blur-color', overlayBlurColor)
      root.style.setProperty('--tile-radius', imageBorderRadius)
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius)
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none')
      applyTransform(rotationRef.current.x, rotationRef.current.y)
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius, tileInsetPx])

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current)
      inertiaRAF.current = null
    }
  }, [])

  useEffect(() => {
    const run = (ts: number) => {
      if (autoRotateLastTs.current == null) {
        autoRotateLastTs.current = ts
      }
      const dt = Math.min((ts - (autoRotateLastTs.current ?? ts)) / 1000, 0.05)
      autoRotateLastTs.current = ts

      if (!draggingRef.current && !focusedElRef.current && !openingRef.current) {
        const nextY = wrapAngleSigned(rotationRef.current.y + autoRotateSpeedDeg * dt)
        rotationRef.current = {
          x: rotationRef.current.x,
          y: nextY,
        }
        applyTransform(rotationRef.current.x, rotationRef.current.y)
      }
      autoRotateRAF.current = requestAnimationFrame(run)
    }

    if (autoRotateSpeedDeg > 0) {
      autoRotateRAF.current = requestAnimationFrame(run)
    }

    return () => {
      if (autoRotateRAF.current) cancelAnimationFrame(autoRotateRAF.current)
      autoRotateRAF.current = null
      autoRotateLastTs.current = null
    }
  }, [autoRotateSpeedDeg])

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4
      let vX = clamp(vx, -MAX_V, MAX_V) * 80
      let vY = clamp(vy, -MAX_V, MAX_V) * 80
      let frames = 0
      const d = clamp(dragDampening ?? 0.6, 0, 1)
      const frictionMul = 0.94 + 0.055 * d
      const stopThreshold = 0.015 - 0.01 * d
      const maxFrames = Math.round(90 + 270 * d)
      const step = () => {
        vX *= frictionMul
        vY *= frictionMul
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null
          return
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null
          return
        }
        const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg)
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200)
        rotationRef.current = { x: nextX, y: nextY }
        applyTransform(nextX, nextY)
        inertiaRAF.current = requestAnimationFrame(step)
      }
      stopInertia()
      inertiaRAF.current = requestAnimationFrame(step)
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  )

  const navigateToHref = useCallback(
    (href: string) => {
      const target = href.trim()
      if (!target) return
      // Full navigation so ?program= and #programs-library run scroll/highlight on /programs.
      if (target.includes('program=') || target.includes('#')) {
        window.location.assign(target)
        return
      }
      router.push(target)
    },
    [router]
  )

  const openItemFromElement = useCallback((el: HTMLElement) => {
    if (clickHref) {
      navigateToHref(clickHref)
      return
    }
    const parent = el.parentElement as HTMLElement | null
    const tileHref = parent?.dataset.href?.trim()
    if (navigateOnClick && tileHref) {
      navigateToHref(tileHref)
      return
    }
    if (!parent || openingRef.current) return
    openingRef.current = true
    openStartedAtRef.current = performance.now()
    lockScroll()
    focusedElRef.current = el
    el.setAttribute('data-focused', 'true')

    const offsetX = getDataNumber(parent, 'offsetX', 0)
    const offsetY = getDataNumber(parent, 'offsetY', 0)
    const sizeX = getDataNumber(parent, 'sizeX', 2)
    const sizeY = getDataNumber(parent, 'sizeY', 2)
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, activeSegmentsRef.current)
    const parentY = normalizeAngle(parentRot.rotateY)
    const globalY = normalizeAngle(rotationRef.current.y)
    let rotY = -(parentY + globalY) % 360
    if (rotY < -180) rotY += 360
    const rotX = -parentRot.rotateX - rotationRef.current.x
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`)
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`)

    const refDiv = document.createElement('div')
    refDiv.className = 'item__image item__image--reference opacity-0'
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`
    parent.appendChild(refDiv)
    void refDiv.offsetHeight

    const tileR = refDiv.getBoundingClientRect()
    const mainR = mainRef.current?.getBoundingClientRect()
    const frameR = frameRef.current?.getBoundingClientRect()
    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      openingRef.current = false
      focusedElRef.current = null
      parent.removeChild(refDiv)
      unlockScroll()
      return
    }

    originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height }
    el.style.visibility = 'hidden'
    ;(el.style as CSSStyleDeclaration).zIndex = '0'

    const overlay = document.createElement('div')
    overlay.className = 'enlarge'
    overlay.style.cssText = `position:absolute; left:${frameR.left - mainR.left}px; top:${frameR.top - mainR.top}px; width:${frameR.width}px; height:${frameR.height}px; opacity:0; z-index:30; will-change:transform,opacity; transform-origin:top left; transition:transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease; border-radius:${openedImageBorderRadius}; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.35);`

    const rawSrc = parent.dataset.src || (el.querySelector('img') as HTMLImageElement | null)?.src || ''
    const rawAlt = parent.dataset.alt || (el.querySelector('img') as HTMLImageElement | null)?.alt || ''
    const img = document.createElement('img')
    img.src = rawSrc
    img.alt = rawAlt
    img.style.cssText = `width:100%; height:100%; object-fit:cover; filter:${grayscale ? 'grayscale(1)' : 'none'};`
    overlay.appendChild(img)
    viewerRef.current?.appendChild(overlay)

    const tx0 = tileR.left - frameR.left
    const ty0 = tileR.top - frameR.top
    const sx0 = tileR.width / frameR.width
    const sy0 = tileR.height / frameR.height
    const validSx0 = Number.isFinite(sx0) && sx0 > 0 ? sx0 : 1
    const validSy0 = Number.isFinite(sy0) && sy0 > 0 ? sy0 : 1
    overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`

    setTimeout(() => {
      if (!overlay.parentElement) return
      overlay.style.opacity = '1'
      overlay.style.transform = 'translate(0px, 0px) scale(1, 1)'
      rootRef.current?.setAttribute('data-enlarging', 'true')
    }, 16)

    if (openedImageWidth || openedImageHeight) {
      const onFirstEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== 'transform') return
        overlay.removeEventListener('transitionend', onFirstEnd)
        const tempWidth = openedImageWidth || `${frameR.width}px`
        const tempHeight = openedImageHeight || `${frameR.height}px`
        overlay.style.transition = 'none'
        overlay.style.width = tempWidth
        overlay.style.height = tempHeight
        const newRect = overlay.getBoundingClientRect()
        overlay.style.width = `${frameR.width}px`
        overlay.style.height = `${frameR.height}px`
        void overlay.offsetWidth
        overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`
        const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2
        const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2
        requestAnimationFrame(() => {
          overlay.style.left = `${centeredLeft}px`
          overlay.style.top = `${centeredTop}px`
          overlay.style.width = tempWidth
          overlay.style.height = tempHeight
        })
      }
      overlay.addEventListener('transitionend', onFirstEnd)
    }
  }, [clickHref, enlargeTransitionMs, grayscale, lockScroll, navigateOnClick, navigateToHref, openedImageBorderRadius, openedImageHeight, openedImageWidth, unlockScroll])

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return
        stopInertia()
        const evt = event as PointerEvent
        pointerTypeRef.current = (evt.pointerType as 'mouse' | 'pen' | 'touch') || 'mouse'
        if (pointerTypeRef.current === 'touch') evt.preventDefault()
        if (pointerTypeRef.current === 'touch') lockScroll()
        draggingRef.current = true
        cancelTapRef.current = false
        movedRef.current = false
        startRotRef.current = { ...rotationRef.current }
        startPosRef.current = { x: evt.clientX, y: evt.clientY }
        tapTargetRef.current = (evt.target as Element).closest?.('.item__image') as HTMLElement | null
      },
      onDrag: ({ event, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return
        const evt = event as PointerEvent
        if (pointerTypeRef.current === 'touch') evt.preventDefault()

        const dxTotal = evt.clientX - startPosRef.current.x
        const dyTotal = evt.clientY - startPosRef.current.y
        if (!movedRef.current && dxTotal * dxTotal + dyTotal * dyTotal > 16) movedRef.current = true

        const nextX = clamp(startRotRef.current.x - dyTotal / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg)
        const nextY = startRotRef.current.y + dxTotal / dragSensitivity
        const cur = rotationRef.current
        if (cur.x !== nextX || cur.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY }
          applyTransform(nextX, nextY)
        }

        if (last) {
          draggingRef.current = false
          let isTap = false
          const dx = evt.clientX - startPosRef.current.x
          const dy = evt.clientY - startPosRef.current.y
          const TAP_THRESH_PX = pointerTypeRef.current === 'touch' ? 10 : 6
          if (dx * dx + dy * dy <= TAP_THRESH_PX * TAP_THRESH_PX) isTap = true

          const [vMagX, vMagY] = velArr
          const [dirX, dirY] = dirArr
          let vx = vMagX * dirX
          let vy = vMagY * dirY
          if (!isTap && Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement
            vx = (mx / dragSensitivity) * 0.02
            vy = (my / dragSensitivity) * 0.02
          }
          if (!isTap && (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005)) startInertia(vx, vy)

          startPosRef.current = null
          cancelTapRef.current = !isTap
          if (isTap && tapTargetRef.current && !focusedElRef.current) openItemFromElement(tapTargetRef.current)
          tapTargetRef.current = null
          if (cancelTapRef.current) setTimeout(() => { cancelTapRef.current = false }, 120)
          if (pointerTypeRef.current === 'touch') unlockScroll()
          if (movedRef.current) lastDragEndAt.current = performance.now()
          movedRef.current = false
        }
      },
    },
    { target: mainRef, eventOptions: { passive: false } }
  )

  useEffect(() => {
    // Mobile safety: if a touch/pointer cancel happens, ensure drag mode is reset
    // so auto-rotation can continue.
    const resetDragState = () => {
      draggingRef.current = false
      startPosRef.current = null
      movedRef.current = false
      cancelTapRef.current = false
      tapTargetRef.current = null
      unlockScroll()
    }

    window.addEventListener('pointerup', resetDragState)
    window.addEventListener('pointercancel', resetDragState)
    window.addEventListener('touchend', resetDragState)
    window.addEventListener('touchcancel', resetDragState)

    return () => {
      window.removeEventListener('pointerup', resetDragState)
      window.removeEventListener('pointercancel', resetDragState)
      window.removeEventListener('touchend', resetDragState)
      window.removeEventListener('touchcancel', resetDragState)
    }
  }, [unlockScroll])

  useEffect(() => {
    const scrim = scrimRef.current
    if (!scrim) return

    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return
      const el = focusedElRef.current
      if (!el) return
      const parent = el.parentElement as HTMLElement
      const overlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement | null
      if (!overlay) return
      const refDiv = parent.querySelector('.item__image--reference') as HTMLElement | null
      const originalPos = originalTilePositionRef.current
      if (!originalPos) {
        overlay.remove()
        refDiv?.remove()
        parent.style.setProperty('--rot-y-delta', '0deg')
        parent.style.setProperty('--rot-x-delta', '0deg')
        el.style.visibility = ''
        el.style.zIndex = '0'
        focusedElRef.current = null
        rootRef.current?.removeAttribute('data-enlarging')
        openingRef.current = false
        return
      }

      const currentRect = overlay.getBoundingClientRect()
      const rootRect = rootRef.current!.getBoundingClientRect()
      const originalPosRelativeToRoot = {
        left: originalPos.left - rootRect.left,
        top: originalPos.top - rootRect.top,
        width: originalPos.width,
        height: originalPos.height,
      }
      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height,
      }

      const animatingOverlay = document.createElement('div')
      animatingOverlay.className = 'enlarge-closing'
      animatingOverlay.style.cssText = `position:absolute; left:${overlayRelativeToRoot.left}px; top:${overlayRelativeToRoot.top}px; width:${overlayRelativeToRoot.width}px; height:${overlayRelativeToRoot.height}px; z-index:9999; border-radius:${openedImageBorderRadius}; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.35); transition:all ${enlargeTransitionMs}ms ease-out; pointer-events:none; margin:0; transform:none; filter:${grayscale ? 'grayscale(1)' : 'none'};`
      const originalImg = overlay.querySelector('img')
      if (originalImg) {
        const img = originalImg.cloneNode() as HTMLImageElement
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
        animatingOverlay.appendChild(img)
      }

      overlay.remove()
      rootRef.current?.appendChild(animatingOverlay)
      void animatingOverlay.getBoundingClientRect()
      requestAnimationFrame(() => {
        animatingOverlay.style.left = `${originalPosRelativeToRoot.left}px`
        animatingOverlay.style.top = `${originalPosRelativeToRoot.top}px`
        animatingOverlay.style.width = `${originalPosRelativeToRoot.width}px`
        animatingOverlay.style.height = `${originalPosRelativeToRoot.height}px`
        animatingOverlay.style.opacity = '0'
      })

      const cleanup = () => {
        animatingOverlay.remove()
        originalTilePositionRef.current = null
        refDiv?.remove()
        parent.style.transition = 'none'
        el.style.transition = 'none'
        parent.style.setProperty('--rot-y-delta', '0deg')
        parent.style.setProperty('--rot-x-delta', '0deg')
        requestAnimationFrame(() => {
          el.style.visibility = ''
          el.style.opacity = '0'
          el.style.zIndex = '0'
          focusedElRef.current = null
          rootRef.current?.removeAttribute('data-enlarging')
          requestAnimationFrame(() => {
            parent.style.transition = ''
            el.style.transition = 'opacity 300ms ease-out'
            requestAnimationFrame(() => {
              el.style.opacity = '1'
              setTimeout(() => {
                el.style.transition = ''
                el.style.opacity = ''
                openingRef.current = false
                if (!draggingRef.current && rootRef.current?.getAttribute('data-enlarging') !== 'true') document.body.classList.remove('dg-scroll-lock')
              }, 300)
            })
          })
        })
      }
      animatingOverlay.addEventListener('transitionend', cleanup, { once: true })
    }

    scrim.addEventListener('click', close)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      scrim.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [enlargeTransitionMs, grayscale, openedImageBorderRadius])

  useEffect(() => {
    return () => {
      document.body.classList.remove('dg-scroll-lock')
    }
  }, [])

  const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --viewer-pad: 72px;
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }
    .sphere-root * { box-sizing: border-box; }
    .sphere, .sphere-item, .item__image { transform-style: preserve-3d; }
    .stage { width: 100%; height: 100%; display: grid; place-items: center; position: absolute; inset: 0; margin: auto; perspective: calc(var(--radius) * 2); perspective-origin: 50% 50%; }
    .sphere { transform: translateZ(calc(var(--radius) * -1)); will-change: transform; position: absolute; }
    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px; bottom: -999px; left: -999px; right: -999px;
      margin: auto;
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      transition: transform 300ms;
      transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
                 rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
                 translateZ(var(--radius));
    }
    .sphere-root[data-enlarging="true"] .scrim { opacity: 1 !important; pointer-events: all !important; }
    @media (max-aspect-ratio: 1/1) { .viewer-frame { height: auto !important; width: 100% !important; } }
    .item__image {
      position: absolute;
      inset: var(--tile-inset, 10px);
      border-radius: var(--tile-radius, 12px);
      overflow: hidden;
      cursor: pointer;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transition: transform 300ms;
      pointer-events: auto;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    .item__image--reference {
      position: absolute;
      inset: var(--tile-inset, 10px);
      pointer-events: none;
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div
        ref={rootRef}
        className="sphere-root relative h-full w-full"
        style={
          {
            ['--segments-x' as string]: segments,
            ['--segments-y' as string]: segments,
            ['--overlay-blur-color' as string]: overlayBlurColor,
            ['--tile-radius' as string]: imageBorderRadius,
            ['--enlarge-radius' as string]: openedImageBorderRadius,
            ['--image-filter' as string]: grayscale ? 'grayscale(1)' : 'none',
            ['--tile-inset' as string]: `${tileInsetPx}px`,
          } as CSSProperties
        }
      >
        <main ref={mainRef} className="absolute inset-0 grid select-none place-items-center overflow-hidden bg-transparent" style={{ touchAction: 'none', WebkitUserSelect: 'none' }}>
          <div className="stage">
            <div ref={sphereRef} className="sphere">
              {items.map((it, i) => (
                <div
                  key={`${it.x},${it.y},${i}`}
                  className="sphere-item absolute m-auto"
                  data-src={it.src}
                  data-alt={it.alt}
                  data-href={it.href || undefined}
                  data-offset-x={it.x}
                  data-offset-y={it.y}
                  data-size-x={it.sizeX}
                  data-size-y={it.sizeY}
                  style={
                    {
                      ['--offset-x' as string]: it.x,
                      ['--offset-y' as string]: it.y,
                      ['--item-size-x' as string]: it.sizeX,
                      ['--item-size-y' as string]: it.sizeY,
                      top: '-999px',
                      bottom: '-999px',
                      left: '-999px',
                      right: '-999px',
                    } as CSSProperties
                  }
                >
                  <div
                    className="item__image absolute block cursor-pointer overflow-hidden bg-gray-200 transition-transform duration-300"
                    role="button"
                    tabIndex={0}
                    aria-label={it.alt || 'Open image'}
                    onClick={(e) => {
                      if (draggingRef.current || movedRef.current || performance.now() - lastDragEndAt.current < 80 || openingRef.current) return
                      openItemFromElement(e.currentTarget as HTMLElement)
                    }}
                    onPointerUp={(e) => {
                      if ((e.nativeEvent as PointerEvent).pointerType !== 'touch') return
                      if (draggingRef.current || movedRef.current || performance.now() - lastDragEndAt.current < 80 || openingRef.current) return
                      openItemFromElement(e.currentTarget as HTMLElement)
                    }}
                    style={{ borderRadius: `var(--tile-radius, ${imageBorderRadius})`, backfaceVisibility: 'hidden' }}
                  >
                    <Image
                      src={it.src || '/assets/logo.webp'}
                      draggable={false}
                      alt={it.alt}
                      fill
                      quality={55}
                      loading="lazy"
                      fetchPriority="low"
                      decoding="async"
                      sizes="(max-width: 768px) 34vw, (max-width: 1280px) 18vw, 220px"
                      className="h-full w-full pointer-events-none object-cover"
                      style={{ backfaceVisibility: 'hidden', filter: `var(--image-filter, ${grayscale ? 'grayscale(1)' : 'none'})` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[3] m-auto" style={{ backgroundImage: `radial-gradient(rgba(235, 235, 235, 0) 65%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)` }} />
          <div className="pointer-events-none absolute inset-0 z-[3] m-auto" style={{ WebkitMaskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`, maskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`, backdropFilter: 'blur(3px)' }} />
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-[5] h-0 rotate-180 sm:h-[120px]" style={{ background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))` }} />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] h-0 sm:h-[120px]" style={{ background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))` }} />

          <div ref={viewerRef} className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" style={{ padding: 'var(--viewer-pad)' }}>
            <div ref={scrimRef} className="scrim pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500" style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(3px)' }} />
            <div ref={frameRef} className="viewer-frame flex h-full aspect-square" style={{ borderRadius: `var(--enlarge-radius, ${openedImageBorderRadius})` }} />
          </div>
        </main>
      </div>
    </>
  )
}
