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
  /** Sentences shown on mobile before expand when paragraph preview is not used. */
  previewSentences?: number
  /** Full paragraphs kept visible before Read More on mobile/tablet (preferred for structured copy). */
  previewParagraphCount?: number
  className?: string
  paragraphClassName?: string
  paragraphClassNames?: string[]
}

const READ_TOGGLE_CLASS =
  'inline-flex shrink-0 rounded border border-amber-400/80 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase leading-none tracking-[0.1em] text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.35)] transition hover:border-amber-200 hover:text-amber-50 hover:shadow-[0_0_18px_rgba(251,191,36,0.5)]'

const READ_TOGGLE_BLOCK_CLASS = cn(READ_TOGGLE_CLASS, 'mt-3')

export function MobileReadMoreText({
  paragraphs,
  previewSentences = 3,
  previewParagraphCount,
  className,
  paragraphClassName,
  paragraphClassNames,
}: MobileReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [isCompactViewport, setIsCompactViewport] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const sync = () => setIsCompactViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const sentences = useMemo(() => splitSentences(paragraphs.join(' ')), [paragraphs])
  const usesParagraphPreview = previewParagraphCount != null && previewParagraphCount > 0
  const needsCollapse = isCompactViewport && (
    usesParagraphPreview
      ? paragraphs.length > previewParagraphCount
      : sentences.length > previewSentences
  )
  const showFull = !needsCollapse || expanded

  const resolveParagraphClass = (index: number) =>
    paragraphClassNames?.[index] ?? paragraphClassName ?? ''

  const readMoreBtn = needsCollapse ? (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      className={READ_TOGGLE_BLOCK_CLASS}
      aria-expanded={false}
    >
      Read More
    </button>
  ) : null

  const readLessBtn = needsCollapse ? (
    <button
      type="button"
      onClick={() => setExpanded(false)}
      className={READ_TOGGLE_BLOCK_CLASS}
      aria-expanded={true}
    >
      Read Less
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
        {expanded ? readLessBtn : null}
      </div>
    )
  }

  if (usesParagraphPreview) {
    const visibleParagraphs = paragraphs.slice(0, previewParagraphCount)
    return (
      <div className={className}>
        {visibleParagraphs.map((paragraph, index) => (
          <p key={index} className={cn(resolveParagraphClass(index), index > 0 && 'mt-4')}>
            {paragraph}
          </p>
        ))}
        {readMoreBtn}
      </div>
    )
  }

  const previewText = sentences.slice(0, previewSentences).join(' ')

  return (
    <div className={className}>
      <p className={resolveParagraphClass(0)}>{previewText}</p>
      {readMoreBtn}
    </div>
  )
}
