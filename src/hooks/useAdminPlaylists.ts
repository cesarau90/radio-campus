import { useCallback, useEffect, useMemo, useState } from 'react'
import { addSongToPlaylist, fetchPlaylistLinks, fetchPlaylists, removeSongFromPlaylist, setFallbackPlaylist } from '../lib/api'
import type { Playlist, PlaylistSong, Song } from '../types'

const MAX_RESULTS = 8
const MIN_FALLBACK_SONGS = 2 // start_round necesita al menos 2 canciones utilizables en la playlist de respaldo

/** ¿La canción puede entrar a una ronda? (activa y no restringida). */
export const isUsable = (s: Song) => s.active && !s.restricted

/**
 * Playlists (Fase 10, versión sencilla): ver las playlists, agregar o quitar canciones con un buscador y marcar cuál
 * es la de respaldo (la que usa la radio cuando no hay clima o hay pocas canciones elegibles). Las playlists no se enlazan a las reglas.
 * `allSongs` es el catálogo completo (viene de useAdminSongs).
 */
export function useAdminPlaylists(enabled: boolean, allSongs: Song[]) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [links, setLinks] = useState<PlaylistSong[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmFallbackId, setConfirmFallbackId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [p, l] = await Promise.all([fetchPlaylists(), fetchPlaylistLinks()])
      setPlaylists(p)
      setLinks(l)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [enabled, load])

  const songsById = useMemo(() => new Map(allSongs.map((s) => [s.id, s])), [allSongs])

  // Si no hay una elegida (o ya no existe), se muestra la de respaldo y, si no, la primera.
  const current = playlists.find((p) => p.id === selectedId) ?? playlists.find((p) => p.is_fallback) ?? playlists[0] ?? null

  const rows = useMemo(() => {
    if (!current) return []
    return links
      .filter((l) => l.playlist_id === current.id)
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ link: l, song: songsById.get(l.song_id) ?? null }))
  }, [links, current, songsById])

  const usableCount = rows.filter((r) => r.song && isUsable(r.song)).length

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const l of links) c[l.playlist_id] = (c[l.playlist_id] ?? 0) + 1
    return c
  }, [links])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!current || !q) return []
    const inList = new Set(rows.map((r) => r.link.song_id))
    return allSongs
      .filter((s) => !inList.has(s.id) && `${s.title} ${s.artist} ${s.genre} ${s.mood}`.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS)
  }, [allSongs, rows, current, search])

  const run = useCallback(
    async (action: () => Promise<void>, done: string) => {
      setBusy(true)
      setError(null)
      setNotice(null)
      try {
        await action()
        setNotice(done)
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    },
    [load],
  )

  const select = useCallback((id: string) => {
    setSelectedId(id)
    setSearch('')
    setNotice(null)
    setConfirmFallbackId(null)
  }, [])

  const add = useCallback(
    (song: Song) => {
      if (!current) return
      const position = rows.reduce((m, r) => Math.max(m, r.link.position), 0) + 1
      return run(() => addSongToPlaylist(current.id, song.id, position), `"${song.title}" agregada a ${current.name}.`)
    },
    [current, rows, run],
  )

  const remove = useCallback(
    (song: Song | null, songId: string) => {
      if (!current) return
      return run(() => removeSongFromPlaylist(current.id, songId), `${song ? `"${song.title}"` : 'La canción'} quitada de ${current.name}.`)
    },
    [current, run],
  )

  const askFallback = useCallback((id: string | null) => setConfirmFallbackId(id), [])

  const confirmFallback = useCallback(async () => {
    const id = confirmFallbackId
    if (!id) return
    setConfirmFallbackId(null)
    const name = playlists.find((p) => p.id === id)?.name ?? ''
    await run(() => setFallbackPlaylist(id), `"${name}" es ahora la playlist de respaldo.`)
  }, [confirmFallbackId, playlists, run])

  const fallbackWarning =
    current?.is_fallback && usableCount < MIN_FALLBACK_SONGS
      ? `La playlist de respaldo necesita al menos ${MIN_FALLBACK_SONGS} canciones activas y no restringidas; ahora tiene ${usableCount}. Con menos, la radio no puede abrir rondas de respaldo.`
      : null

  return {
    playlists,
    loading,
    error,
    notice,
    busy,
    current,
    rows,
    counts,
    usableCount,
    search,
    setSearch,
    results,
    select,
    add,
    remove,
    confirmFallbackId,
    askFallback,
    confirmFallback,
    fallbackWarning,
  }
}

export type AdminPlaylistsModel = ReturnType<typeof useAdminPlaylists>
