'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlaylistCardsSection } from '@/components/programs/PlaylistCardsSection'
import {
  resolveProgramPlaylistHighlightId,
  resolveProgramPlaylistHighlightSlug,
} from '@/lib/programPlaylistCatalog'
import { fetchPublicStreamPlaylists, type StreamPlaylistListItem } from '@/lib/streaming-api'
import { parsePackDeepLinkSlug } from '@/lib/programPlaylistThumbnails'

type Props = {
  title?: string
  subtitle?: string
}

export function ProgramsLibrarySection({ title, subtitle }: Props) {
  const searchParams = useSearchParams()
  const slugParam = searchParams.get('slug')?.trim().toLowerCase() ?? undefined
  const packSlug = Boolean(parsePackDeepLinkSlug(slugParam))
  const raw = searchParams.get('program')
  const legacyId = raw ? Number.parseInt(raw, 10) : undefined
  const [playlists, setPlaylists] = useState<StreamPlaylistListItem[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchPublicStreamPlaylists()
      .then((list) => {
        if (!cancelled) setPlaylists(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setPlaylists([])
      })
    return () => {
      cancelled = true
    }
  }, [])

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
    />
  )
}
