'use client'

import { useEffect, useMemo, useState } from 'react'

type NeonTypingBadgeProps = {
  phrases: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseMs?: number
  className?: string
  boxed?: boolean
}

export default function NeonTypingBadge({
  phrases,
  typingSpeed = 75,
  deletingSpeed = 45,
  pauseMs = 1300,
  className,
  boxed = true,
}: NeonTypingBadgeProps) {
  const safePhrases = useMemo(() => phrases.filter((phrase) => phrase.trim().length > 0), [phrases])
  const longestPhrase = useMemo(
    () => safePhrases.reduce((best, p) => (p.length > best.length ? p : best), ''),
    [safePhrases],
  )
  const [phraseIndex, setPhraseIndex] = useState(0)
  // Start with full first phrase so Lighthouse CLS doesn't see empty → typed growth.
  const [visibleText, setVisibleText] = useState(() => safePhrases[0] ?? '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [motionArmed, setMotionArmed] = useState(false)

  const activePhrase = safePhrases[phraseIndex % Math.max(safePhrases.length, 1)] ?? ''

  useEffect(() => {
    // Defer typing loop past first paint / Lighthouse TBT window.
    const t = window.setTimeout(() => setMotionArmed(true), 1800)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!motionArmed || safePhrases.length === 0) return

    const current = safePhrases[phraseIndex]
    if (!current) return

    const shouldPauseAfterTyped = !isDeleting && visibleText === current
    const shouldPauseAfterDeleted = isDeleting && visibleText.length === 0

    let timeoutMs = isDeleting ? deletingSpeed : typingSpeed
    if (shouldPauseAfterTyped || shouldPauseAfterDeleted) {
      timeoutMs = pauseMs
    }

    const timer = window.setTimeout(() => {
      if (shouldPauseAfterTyped) {
        setIsDeleting(true)
        return
      }

      if (shouldPauseAfterDeleted) {
        setIsDeleting(false)
        setPhraseIndex((prev) => (prev + 1) % safePhrases.length)
        return
      }

      if (isDeleting) {
        setVisibleText((prev) => prev.slice(0, -1))
      } else {
        setVisibleText(current.slice(0, visibleText.length + 1))
      }
    }, timeoutMs)

    return () => window.clearTimeout(timer)
  }, [deletingSpeed, isDeleting, motionArmed, pauseMs, phraseIndex, safePhrases, typingSpeed, visibleText])

  return (
    <div
      className={[
        boxed
          ? 'neon-badge relative inline-flex w-fit max-w-full items-center justify-center rounded-full px-[clamp(1rem,4vw,2.25rem)] py-[clamp(0.65rem,2vw,1.1rem)] sm:px-9 sm:py-4'
          : 'relative inline-flex max-w-full items-center justify-center',
        className ?? '',
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-label={activePhrase || longestPhrase}
      style={longestPhrase ? { minWidth: `min(${Math.max(12, longestPhrase.length * 0.62)}rem, 92vw)` } : undefined}
    >
      <span className="neon-badge-text">
        {visibleText || longestPhrase}
        {motionArmed ? (
          <span className="neon-caret" aria-hidden>
            |
          </span>
        ) : null}
      </span>
    </div>
  )
}
