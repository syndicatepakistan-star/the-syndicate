'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/components/dashboard/dashboardPrimitives'

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  const parts = normalized.split(/(?<=[.!?])\s+(?=[A-Z"'(])/).filter(Boolean)
  if (parts.length > 1) return parts
  return normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
}

type MobileReadMoreTextProps = {
  paragraphs: string[]
  /** Sentences shown on mobile before expand (default 3). */
  previewSentences?: number
  className?: string
  paragraphClassName?: string
  paragraphClassNames?: string[]
}

export function MobileReadMoreText({
  paragraphs,
  previewSentences = 3,
  className,
  paragraphClassName,
  paragraphClassNames,
}: MobileReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const sentences = useMemo(() => splitSentences(paragraphs.join(' ')), [paragraphs])
  const needsCollapse = isMobile && sentences.length > previewSentences
  const showFull = !needsCollapse || expanded

  const resolveParagraphClass = (index: number) =>
    paragraphClassNames?.[index] ?? paragraphClassName ?? ''

  const toggleBtn = needsCollapse ? (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        'mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-amber-400/85 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.55),0_0_22px_rgba(251,191,36,0.45),0_0_40px_rgba(251,191,36,0.22),inset_0_0_14px_rgba(251,191,36,0.12)] transition hover:border-amber-200 hover:text-amber-50 hover:shadow-[0_0_28px_rgba(251,191,36,0.55),0_0_48px_rgba(251,191,36,0.32)] sm:text-sm',
        expanded ? 'bg-amber-500/15' : 'bg-amber-500/22',
      )}
      aria-expanded={expanded}
    >
      {expanded ? 'Read Less' : 'Read More'}
    </button>
  ) : null

  if (showFull) {
    return (
      <div className={className}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={cn(resolveParagraphClass(index), index > 0 && 'mt-4')}>
            {paragraph}
          </p>
        ))}
        {toggleBtn}
      </div>
    )
  }

  const previewText = sentences.slice(0, previewSentences).join(' ')

  return (
    <div className={className}>
      <p className={resolveParagraphClass(0)}>{previewText}</p>
      {toggleBtn}
    </div>
  )
}
