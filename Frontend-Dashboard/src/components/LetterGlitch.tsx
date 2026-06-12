'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  captureHeroGlitchState,
  restoreHeroGlitchState,
  type GlitchLetter,
} from '@/lib/heroGlitchSnapshot'

type LetterGlitchProps = {
  glitchColors?: string[]
  glitchSpeed?: number
  centerVignette?: boolean
  outerVignette?: boolean
  smooth?: boolean
  characters?: string
  className?: string
  /** 0–1: opacity for canvas + vignette overlays */
  layerOpacity?: number
}

const DEFAULT_COLORS = ['#2b4539', '#61dca3', '#61b3dc']
const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'

const FONT_SIZE = 16
const CHAR_WIDTH = 10
const CHAR_HEIGHT = 20
const UPDATE_RATIO = 0.05
const SMOOTH_STEP = 0.05

export default function LetterGlitch({
  glitchColors = DEFAULT_COLORS,
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = DEFAULT_CHARACTERS,
  className,
  layerOpacity = 1,
}: LetterGlitchProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const animationRef = useRef<number | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const lettersRef = useRef<GlitchLetter[]>([])
  const gridRef = useRef({ columns: 0, rows: 0 })
  const lastGlitchTimeRef = useRef(0)
  const containerSizeRef = useRef({ width: 0, height: 0 })
  const pausedRef = useRef(false)
  const inViewRef = useRef(true)

  const lettersAndSymbols = useMemo(() => Array.from(characters), [characters])

  const rgbColorPool = useMemo(() => {
    const hexToRgb = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
      const normalized = hex.replace(shorthandRegex, (_m, r, g, b) => `${r}${r}${g}${g}${b}${b}`)
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized)
      return result
        ? {
            r: Number.parseInt(result[1], 16),
            g: Number.parseInt(result[2], 16),
            b: Number.parseInt(result[3], 16),
          }
        : null
    }

    const pool = glitchColors.map((color) => ({ hex: color, rgb: hexToRgb(color) })).filter((c): c is { hex: string; rgb: { r: number; g: number; b: number } } => Boolean(c.rgb))
    return pool.length > 0 ? pool : DEFAULT_COLORS.map((hex) => ({ hex, rgb: { r: 97, g: 179, b: 220 } }))
  }, [glitchColors])

  const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)] ?? 'A'
  const getRandomColor = () => rgbColorPool[Math.floor(Math.random() * rgbColorPool.length)]?.hex ?? DEFAULT_COLORS[0]

  const calculateGrid = (width: number, height: number) => {
    const columns = Math.ceil(width / CHAR_WIDTH)
    const rows = Math.ceil(height / CHAR_HEIGHT)
    return { columns, rows }
  }

  const drawLetters = () => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas || lettersRef.current.length === 0) return

    const { width, height } = containerSizeRef.current
    ctx.clearRect(0, 0, width, height)
    ctx.font = `${FONT_SIZE}px monospace`
    ctx.textBaseline = 'top'

    lettersRef.current.forEach((letter, index) => {
      const x = (index % gridRef.current.columns) * CHAR_WIDTH
      const y = Math.floor(index / gridRef.current.columns) * CHAR_HEIGHT
      ctx.fillStyle = letter.color
      ctx.fillText(letter.char, x, y)
    })
  }

  const initializeLetters = (columns: number, rows: number) => {
    const totalLetters = columns * rows
    gridRef.current = { columns, rows }
    lettersRef.current = Array.from({ length: totalLetters }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1,
    }))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const dpr = window.devicePixelRatio || 1
    const restored = restoreHeroGlitchState(canvas, dpr)
    if (restored && Math.abs(restored.cssWidth - rect.width) < 2 && Math.abs(restored.cssHeight - rect.height) < 2) {
      contextRef.current = canvas.getContext('2d')
      if (contextRef.current) contextRef.current.setTransform(dpr, 0, 0, dpr, 0, 0)
      containerSizeRef.current = { width: rect.width, height: rect.height }
      gridRef.current = { columns: restored.columns, rows: restored.rows }
      lettersRef.current = restored.letters.map((letter) => ({ ...letter }))
      return
    }

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    containerSizeRef.current = { width: rect.width, height: rect.height }

    const ctx = contextRef.current
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const { columns, rows } = calculateGrid(rect.width, rect.height)
    initializeLetters(columns, rows)
    drawLetters()
  }

  const interpolateColor = (
    start: { r: number; g: number; b: number },
    end: { r: number; g: number; b: number },
    factor: number,
  ) => {
    const r = Math.round(start.r + (end.r - start.r) * factor)
    const g = Math.round(start.g + (end.g - start.g) * factor)
    const b = Math.round(start.b + (end.b - start.b) * factor)
    return `rgb(${r}, ${g}, ${b})`
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateLetters = () => {
    const letters = lettersRef.current
    if (letters.length === 0) return

    const updateCount = Math.max(1, Math.floor(letters.length * UPDATE_RATIO))
    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.length)
      const nextColor = getRandomColor()
      const letter = letters[index]
      if (!letter) continue

      letter.char = getRandomChar()
      letter.targetColor = nextColor
      if (!smooth) {
        letter.color = nextColor
        letter.colorProgress = 1
      } else {
        letter.colorProgress = 0
      }
    }
  }

  const getRgbForColor = (value: string) => rgbColorPool.find((entry) => entry.hex === value)?.rgb ?? null

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSmoothTransitions = () => {
    let needsRedraw = false
    lettersRef.current.forEach((letter) => {
      if (letter.colorProgress >= 1) return
      letter.colorProgress += SMOOTH_STEP
      if (letter.colorProgress > 1) letter.colorProgress = 1

      const startRgb = getRgbForColor(letter.color)
      const endRgb = getRgbForColor(letter.targetColor)
      if (!startRgb || !endRgb) return

      letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress)
      needsRedraw = true
      if (letter.colorProgress === 1) {
        letter.color = letter.targetColor
      }
    })

    if (needsRedraw) drawLetters()
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    contextRef.current = canvas.getContext('2d')
    resizeCanvas()
  }, [resizeCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onVisibility = () => {
      pausedRef.current = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    const visibilityObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              inViewRef.current = entry.isIntersecting
            },
            { rootMargin: '80px 0px', threshold: 0.02 },
          )
        : null
    visibilityObserver?.observe(canvas)

    const animate = (time: number) => {
      const active = !pausedRef.current && inViewRef.current
      if (active) {
        if (time - lastGlitchTimeRef.current >= glitchSpeed) {
          updateLetters()
          drawLetters()
          lastGlitchTimeRef.current = time
        }
        if (smooth) handleSmoothTransitions()
      }
      animationRef.current = window.requestAnimationFrame(animate)
    }

    animationRef.current = window.requestAnimationFrame(animate)

    resizeObserverRef.current = new ResizeObserver(() => resizeCanvas())
    const parent = canvas.parentElement
    if (parent) resizeObserverRef.current.observe(parent)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      visibilityObserver?.disconnect()
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current)
      resizeObserverRef.current?.disconnect()
      if (canvas.width > 0 && canvas.height > 0) {
        captureHeroGlitchState(
          canvas,
          containerSizeRef.current.width,
          containerSizeRef.current.height,
          gridRef.current.columns,
          gridRef.current.rows,
          lettersRef.current,
        )
      }
    }
  }, [glitchSpeed, smooth, handleSmoothTransitions, resizeCanvas, updateLetters, drawLetters])

  const safeOpacity = Math.min(1, Math.max(0, layerOpacity))

  return (
    <div
      className={`relative isolate h-full w-full min-w-0 max-w-full overflow-hidden bg-black ${className ?? ''}`.trim()}
      style={{ opacity: safeOpacity }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {outerVignette && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0)_60%,_rgba(0,0,0,1)_100%)]" />
      )}
      {centerVignette && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.8)_0%,_rgba(0,0,0,0)_60%)]" />
      )}
    </div>
  )
}
