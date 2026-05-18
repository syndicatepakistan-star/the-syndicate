'use client'

import { useSearchParams } from 'next/navigation'
import { PlaylistCardsSection } from '@/components/programs/PlaylistCardsSection'

type Props = {
  title?: string
  subtitle?: string
}

export function ProgramsLibrarySection({ title, subtitle }: Props) {
  const searchParams = useSearchParams()
  const raw = searchParams.get('program')
  const highlightPlaylistId = raw ? Number.parseInt(raw, 10) : undefined
  const validHighlight =
    highlightPlaylistId != null && Number.isFinite(highlightPlaylistId) && highlightPlaylistId > 0
      ? highlightPlaylistId
      : undefined

  return (
    <PlaylistCardsSection
      title={title}
      subtitle={subtitle}
      highlightPlaylistId={validHighlight}
    />
  )
}
