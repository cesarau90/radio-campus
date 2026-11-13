import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  fetchAnnouncements,
  fetchCurrentRound,
  fetchPlaybackState,
  fetchSettings,
  fetchSongsByIds,
} from '../lib/api'
import type {
  Announcement,
  ConnectionStatus,
  PlaybackState,
  Round,
  RoundWithSongs,
  Settings,
  Song,
} from '../types'

/**
 * Estado en vivo compartido por /pantalla, /votar y el monitor del admin:
 * ajustes, qué suena, la ronda actual (abierta o la última cerrada), sus canciones y los anuncios.
 * Una sola suscripción Realtime; los conteos de votos llegan en cada UPDATE de la ronda.
 * Si la conexión se cae y vuelve, se recarga todo (los eventos perdidos no se reenvían).
 * `enabled` debe esperar a que haya sesión.
 */
export function useLiveState(enabled: boolean) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [playback, setPlayback] = useState<PlaybackState | null>(null)
  const [round, setRound] = useState<Round | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [songs, setSongs] = useState<Record<string, Song>>({})
  const [connection, setConnection] = useState<ConnectionStatus>('reconnecting')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const songsRef = useRef<Record<string, Song>>({})

  const ensureSongs = useCallback(async (ids: Array<string | null | undefined>) => {
    const missing = [...new Set(ids.filter((id): id is string => !!id && !songsRef.current[id]))]
    if (missing.length === 0) return
    const rows = await fetchSongsByIds(missing)
    const next = { ...songsRef.current }
    for (const s of rows) next[s.id] = s
    songsRef.current = next
    setSongs(next)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [s, p, r, a] = await Promise.all([
        fetchSettings(),
        fetchPlaybackState(),
        fetchCurrentRound(),
        fetchAnnouncements(),
      ])
      await ensureSongs([r?.option_a, r?.option_b, r?.winner_id, p.current_song_id])
      setSettings(s)
      setPlayback(p)
      setRound(r)
      setAnnouncements(a)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [ensureSongs])

  useEffect(() => {
    if (!enabled) return
    let firstSubscribe = true

    // Carga inicial: el setState ocurre después de los await (no es síncrono en el efecto).
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()

    const channel: RealtimeChannel = supabase
      .channel('radio-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          void refresh()
          return
        }
        const row = payload.new as Round
        // La ronda "actual" es la abierta; si no hay, la última. Se ignoran cambios de rondas viejas.
        setRound((prev) => (row.status === 'open' || !prev || prev.id === row.id ? row : prev))
        void ensureSongs([row.option_a, row.option_b, row.winner_id])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
        setSettings(payload.new as Settings)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'playback_state' }, (payload) => {
        const row = payload.new as PlaybackState
        setPlayback(row)
        void ensureSongs([row.current_song_id])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        void fetchAnnouncements().then(setAnnouncements, () => {})
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnection('connected')
          if (!firstSubscribe) void refresh() // volvió la conexión: ponerse al día
          firstSubscribe = false
        } else if (status === 'CHANNEL_ERROR') {
          setConnection('error')
        } else {
          // TIMED_OUT o CLOSED: supabase-js reintenta solo
          setConnection('reconnecting')
        }
      })

    const onOffline = () => setConnection('error')
    // Si el socket no llegó a caerse, no se vuelve a emitir SUBSCRIBED: se consulta el estado real.
    const onOnline = () => setConnection(channel.state === 'joined' ? 'connected' : 'reconnecting')
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      void supabase.removeChannel(channel)
    }
  }, [enabled, refresh, ensureSongs])

  /** La ronda con sus dos canciones resueltas; null mientras falten datos. */
  const current: RoundWithSongs | null = useMemo(() => {
    if (!round) return null
    const songA = songs[round.option_a]
    const songB = songs[round.option_b]
    return songA && songB ? { round, songA, songB } : null
  }, [round, songs])

  return { settings, playback, round, current, songs, announcements, connection, loading, error, refresh }
}
