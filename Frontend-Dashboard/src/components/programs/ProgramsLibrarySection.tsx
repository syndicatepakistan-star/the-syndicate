'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlaylistCardsSection } from '@/components/programs/PlaylistCardsSection'
import {
  resolveProgramPlaylistHighlightId,
  resolveProgramPlaylistHighlightSlug,
} from '@/lib/programPlaylistCatalog'
import type { StreamPlaylistListItem } from '@/lib/streaming-api'
import { parsePackDeepLinkSlug } from '@/lib/programPlaylistThumbnails'

type Props = {
  title?: string
  subtitle?: string
  /** Server-fetched playlists — paint library immediately, refresh client-side. */
  initialPlaylists?: StreamPlaylistListItem[]
}

export function ProgramsLibrarySection({ title, subtitle, initialPlaylists }: Props) {
  const searchParams = useSearchParams()
  const slugParam = searchParams.get('slug')?.trim().toLowerCase() ?? undefined
  const packSlug = Boolean(parsePackDeepLinkSlug(slugParam))
  const raw = searchParams.get('program')
  const legacyId = raw ? Number.parseInt(raw, 10) : undefined
  const [playlists] = useState<StreamPlaylistListItem[]>(() =>
    Array.isArray(initialPlaylists) ? initialPlaylists : [],
  )

  const highlightPlaylistId = useMemo(() => {
    // Pack marketing URLs reuse `?slug=` (e.g. money-mastery) — leave library alone.
    if (packSlug) return undefined
    if (slugParam) {
      return resolveProgramPlaylistHighlightSlug(playlists, slugParam)
    }
    if (legacyId == null || !Number.isFinite(legacyId) || legacyId <= 0) return undefined
    return resolveProgramPlaylistHighlightId(playlists, legacyId) ?? legacyId
  }, [slugParam, packSlug, legacyId, playlists])

  return (
    <PlaylistCardsSection
      title={title}
      subtitle={subtitle}
      highlightPlaylistId={highlightPlaylistId}
      initialPlaylists={initialPlaylists}
    />
  )
}
