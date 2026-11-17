import { useCallback, useEffect, useState } from 'react'
import { adminForceCloseRound, fetchPlayHistory, fetchRecentClosedRounds, fetchSongsByIds, updateSettings } from '../lib/api'
import { formatClock } from '../lib/time'
import { percentages } from '../lib/votes'
import { useCountdown } from './useCountdown'
import { useLiveState } from './useLiveState'
import { useServerClock } from './useServerClock'
import type { PlayHistoryRow, Round, Song } from '../types'

const HISTORY_ROWS = 15
const CHART_ROUNDS = 10
const REFRESH_MS = 30_000

export interface ChartRow {
  id: string
  titleA: string
  titleB: string
  votesA: number
  votesB: number
  percentA: number
  percentB: number
  winner: 'a' | 'b' | 'otra' | null
  resolution: Round['resolution']
  startsAt: string
}

/**
 * Monitor y controles de la radio (Fase 8): qué suena, la ronda en vivo con sus votos, el contexto con que se creó,
 * las últimas reproducciones y los votos de las últimas rondas. Controles: pausar/reanudar, saltar y cerrar la ronda ya.
 */
export function useAdminMonitor(enabled: boolean) {
  const clock = useServerClock(enabled)
  const live = useLiveState(enabled)
  const { round, playback, settings, songs } = live
  const roundOpen = round?.status === 'open'
  const countdown = useCountdown(round?.ends_at ?? null, clock.nowMs, clock.ready && roundOpen)

  const [history, setHistory] = useState<PlayHistoryRow[]>([])
  const [closed, setClosed] = useState<Round[]>([])
  const [extraSongs, setExtraSongs] = useState<Record<string, Song>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const roundId = round?.id ?? null
  const roundStatus = round?.status ?? null
  const updatedAt = playback?.updated_at ?? null

  const refreshLists = useCallback(async () => {
    try {
      const [h, r] = await Promise.all([fetchPlayHistory(HISTORY_ROWS), fetchRecentClosedRounds(CHART_ROUNDS)])
      const needed = new Set<string>([...h.map((x) => x.song_id), ...r.flatMap((x) => [x.option_a, x.option_b, ...(x.winner_id ? [x.winner_id] : [])])])
      const missing = [...needed].filter((id) => !extraSongs[id])
      if (missing.length > 0) {
        const rows = await fetchSongsByIds(missing)
        setExtraSongs((prev) => ({ ...prev, ...Object.fromEntries(rows.map((s) => [s.id, s])) }))
      }
      setHistory(h)
      setClosed(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    // extraSongs solo decide qué falta por pedir; no debe reiniciar la carga.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!enabled) return
    // oxlint-disable-next-line react/set-state-in-effect
    void refreshLists()
  }, [enabled, refreshLists, roundId, roundStatus, updatedAt])

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => void refreshLists(), REFRESH_MS)
    return () => clearInterval(id)
  }, [enabled, refreshLists])

  const titleOf = useCallback((id: string | null | undefined) => (id ? (songs[id] ?? extraSongs[id])?.title ?? '…' : '—'), [songs, extraSongs])

  const run = useCallback(
    async (action: () => Promise<unknown>, done: string) => {
      setBusy(true)
      setError(null)
      setNotice(null)
      try {
        await action()
        setNotice(done)
        await live.refresh()
        await refreshLists()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    },
    [live, refreshLists],
  )

  const paused = settings?.paused ?? false
  const togglePause = useCallback(
    () => run(() => updateSettings({ paused: !paused }), paused ? 'Radio reanudada.' : 'Radio en pausa: /pantalla deja de avanzar y la música se detiene.'),
    [run, paused],
  )
  const skipSong = useCallback(
    () => run(() => updateSettings({ skip_requested_at: new Date().toISOString() }), 'Salto pedido: /pantalla pasa a la siguiente canción en unos segundos.'),
    [run],
  )
  const askClose = useCallback((v: boolean) => setConfirmClose(v), [])
  const closeNow = useCallback(async () => {
    if (!round || round.status !== 'open') return
    setConfirmClose(false)
    await run(() => adminForceCloseRound(round.id), 'Ronda cerrada ahora. /pantalla anuncia la ganadora.')
  }, [round, run])

  // Votos de la ronda en vivo (o de la última cerrada).
  const pct = percentages(round?.votes_a ?? 0, round?.votes_b ?? 0)
  const nowSong: Song | null = playback?.current_song_id ? (songs[playback.current_song_id] ?? null) : null
  const sinceSec =
    playback?.started_at && clock.ready ? Math.max(0, Math.floor((clock.nowMs() - new Date(playback.started_at).getTime()) / 1000)) : null

  const chart: ChartRow[] = closed
    .map((r) => {
      const p = percentages(r.votes_a, r.votes_b)
      return {
        id: r.id,
        titleA: titleOf(r.option_a),
        titleB: titleOf(r.option_b),
        votesA: r.votes_a,
        votesB: r.votes_b,
        percentA: p.a,
        percentB: p.b,
        winner: (r.winner_id === r.option_a ? 'a' : r.winner_id === r.option_b ? 'b' : r.winner_id ? 'otra' : null) as ChartRow['winner'],
        resolution: r.resolution,
        startsAt: r.starts_at,
      }
    })
    .reverse() // de la más vieja a la más nueva

  return {
    connection: live.connection,
    loading: live.loading,
    paused,
    override: settings?.context_override ?? null,
    nowSong,
    phase: playback?.phase ?? 'idle',
    sinceLabel: sinceSec === null ? null : formatClock(sinceSec),
    round,
    optionA: round ? (songs[round.option_a] ?? null) : null,
    optionB: round ? (songs[round.option_b] ?? null) : null,
    roundOpen,
    timeLabel: countdown.remainingSec === null ? null : formatClock(countdown.remainingSec),
    percentA: pct.a,
    percentB: pct.b,
    history: history.map((h) => ({ ...h, title: titleOf(h.song_id) })),
    chart,
    busy,
    error: error ?? live.error,
    notice,
    confirmClose,
    togglePause,
    skipSong,
    askClose,
    closeNow,
  }
}

export type AdminMonitorModel = ReturnType<typeof useAdminMonitor>
