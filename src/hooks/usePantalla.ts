import { useCallback, useEffect, useRef, useState } from 'react'
import {
  closeRound,
  fetchNextAnnouncement,
  fetchStarterSong,
  markAnnouncementPlayed,
  recordPlay,
  setPhase,
  startRound,
} from '../lib/api'
import { playSeconds } from '../lib/playback'
import { weatherLabel } from '../lib/weather'
import { formatClock } from '../lib/time'
import { percentages } from '../lib/votes'
import { useAnonymousSession } from './useAnonymousSession'
import { useServerClock } from './useServerClock'
import { useLiveState } from './useLiveState'
import { useCountdown } from './useCountdown'
import { useClockLabel } from './useClockLabel'
import { useSpeech } from './useSpeech'
import { useWeather } from './useWeather'
import { useYouTubePlayer } from './useYouTubePlayer'
import type { PlayStatus } from '../types'
import type { PantallaViewName, RoundOption, Song, TallyRow } from '../types'

const STEP_MS = 1000
const RETRY_MS = 3000
const MAX_ERROR_STREAK = 3 // tres canciones seguidas que no suenan: se detiene el reemplazo automático

/**
 * Hook principal de /pantalla: el "director" de la radio.
 * Con el estado del servidor decide el siguiente paso, y cada paso es seguro de repetir (si se recarga, retoma):
 *  1. no hay canción → arranca una (record_play) y abre la primera ronda (start_round);
 *  2. ronda abierta y vencida → la cierra (close_round);
 *  3. ronda cerrada y la canción en curso ya terminó → pone la ganadora (record_play) y abre la siguiente ronda.
 * Los tiempos los decide el servidor; aquí solo se compara contra su reloj. En pausa no avanza nada.
 */
export function usePantalla() {
  const session = useAnonymousSession()
  const clock = useServerClock(session.ready)
  const live = useLiveState(session.ready)
  const { settings, playback, round, songs } = live

  const weather = useWeather(settings?.lat ?? null, settings?.lon ?? null)
  const clockText = useClockLabel(clock.nowMs, clock.ready)

  const roundOpen = round?.status === 'open'
  const countdown = useCountdown(round?.ends_at ?? null, clock.nowMs, clock.ready && roundOpen)

  // Canción en curso y cuándo termina (inicio + lo que suena), para su barra y para saber cuándo entra la ganadora.
  const nowSong: Song | null = playback?.current_song_id ? (songs[playback.current_song_id] ?? null) : null
  const songEndsAt =
    playback?.started_at && settings
      ? new Date(new Date(playback.started_at).getTime() + playSeconds(nowSong, settings) * 1000).toISOString()
      : null
  const songCountdown = useCountdown(songEndsAt, clock.nowMs, clock.ready && !!songEndsAt)

  // ---- saltos: video que falla o salto pedido por el admin ----
  // Se anotan aquí y el director los atiende en su siguiente paso (así nunca hay dos acciones a la vez).
  const pendingSkip = useRef<{ status: PlayStatus; note: string } | null>(null)
  const errorStreak = useRef(0)
  const handlePlayerError = useCallback((code: number) => {
    errorStreak.current += 1
    pendingSkip.current = { status: 'error', note: `YouTube error ${code}` }
  }, [])

  const speech = useSpeech()
  const { speak } = speech
  const player = useYouTubePlayer({
    videoId: nowSong?.youtube_id ?? null,
    startedAt: playback?.started_at ?? null,
    endsAt: songEndsAt,
    nowMs: clock.nowMs,
    ready: clock.ready && !live.loading,
    paused: settings?.paused ?? false,
    duck: speech.speaking,
    onError: handlePlayerError,
  })
  useEffect(() => {
    if (player.status === 'playing') errorStreak.current = 0
  }, [player.status])

  // El admin pidió saltar: se compara contra el valor que ya había al abrir la pantalla.
  const seenSkip = useRef<string | null | undefined>(undefined)
  const skipRequestedAt = settings ? settings.skip_requested_at : undefined
  useEffect(() => {
    if (skipRequestedAt === undefined) return
    if (seenSkip.current === undefined) {
      seenSkip.current = skipRequestedAt
      return
    }
    if (skipRequestedAt && skipRequestedAt !== seenSkip.current) {
      pendingSkip.current = { status: 'skipped', note: 'Saltada por el admin' }
    }
    seenSkip.current = skipRequestedAt
  }, [skipRequestedAt])

  // ---- el director ----
  const [actionError, setActionError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const latest = useRef({ ready: false, settings, playback, round, songs, nowMs: clock.nowMs, refresh: live.refresh, temp: weather?.tempC ?? null })
  useEffect(() => {
    latest.current = {
      ready: session.ready && clock.ready && !live.loading,
      settings,
      playback,
      round,
      songs,
      nowMs: clock.nowMs,
      refresh: live.refresh,
      temp: weather?.tempC ?? null, // sin dato de clima, start_round usa su plan de respaldo
    }
  })
  const busy = useRef(false)
  const retryAt = useRef(0)

  useEffect(() => {
    async function step() {
      const s = latest.current
      if (!s.ready || !s.settings || !s.playback || s.settings.paused) return
      if (busy.current || Date.now() < retryAt.current) return
      busy.current = true
      try {
        const now = s.nowMs()
        const curId = s.playback.current_song_id
        const skip = pendingSkip.current
        if (skip && curId) {
          pendingSkip.current = null
          if (skip.status === 'error' && errorStreak.current > MAX_ERROR_STREAK) {
            throw new Error('Varias canciones seguidas no se pudieron reproducir. Revisa el catálogo o la conexión.')
          }
          // Se registra la que falló o se saltó; entra la ganadora si ya está decidida, y si no, otra canción al azar.
          await recordPlay({ songId: curId, roundId: s.round?.id ?? null, status: skip.status, note: skip.note })
          const winnerNext = s.round?.status === 'closed' && s.round.winner_id && s.round.winner_id !== curId
          let nextId = winnerNext ? s.round!.winner_id! : curId
          for (let i = 0; nextId === curId && i < 5; i++) nextId = (await fetchStarterSong()).id
          if (nextId === curId) throw new Error('No hay otra canción disponible para reemplazarla.')
          await recordPlay({ songId: nextId, roundId: winnerNext ? s.round!.id : null })
          await startRound(s.temp)
        } else if (s.round?.status === 'open') {
          if (now < new Date(s.round.ends_at).getTime()) return
          await closeRound(s.round.id)
        } else if (!curId) {
          const song = await fetchStarterSong()
          await recordPlay({ songId: song.id })
          await startRound(s.temp)
        } else if (s.round?.winner_id && s.round.winner_id !== curId) {
          // Ganadora pendiente: se avisa el resultado y, al terminar la canción en curso, entra la ganadora.
          if (s.playback.phase === 'playing') await setPhase('result')
          const startedAt = s.playback.started_at ? new Date(s.playback.started_at).getTime() : 0
          const endAt = startedAt + playSeconds(s.songs[curId], s.settings) * 1000
          if (now < endAt) return
          // Entre canciones puede tocar un anuncio del admin: se dice en silencio de música y luego entra la ganadora.
          const ann = await fetchNextAnnouncement().catch(() => null)
          if (ann) {
            await markAnnouncementPlayed(ann.id) // primero se marca: si algo falla, no se repite en bucle
            await setPhase('announcement')
            setAnnouncement(ann.text)
            await speak(ann.text)
            setAnnouncement(null)
          }
          await recordPlay({ songId: s.round.winner_id, roundId: s.round.id })
          await startRound(s.temp)
        } else {
          await startRound(s.temp) // la ganadora ya suena (o no hubo rondas): falta abrir la siguiente
        }
        setActionError(null)
        await s.refresh()
      } catch (e) {
        setActionError(e instanceof Error ? e.message : String(e))
        retryAt.current = Date.now() + RETRY_MS
      } finally {
        busy.current = false
      }
    }
    void step()
    const id = setInterval(() => void step(), STEP_MS)
    return () => clearInterval(id)
  }, [speak]) // speak es estable: el director no se reinicia

  // ---- qué se muestra ----
  const current = live.current
  const fatalError = session.error ?? (live.error && !settings ? live.error : null)
  const winner: Song | null = round?.winner_id ? (songs[round.winner_id] ?? null) : null
  const winnerPending = !!round && round.status === 'closed' && !!round.winner_id && round.winner_id !== playback?.current_song_id

  let view: PantallaViewName
  if (fatalError) view = 'error'
  else if (!session.ready || live.loading || !clock.ready) view = 'connecting'
  else if (settings?.paused) view = 'idle'
  else if (roundOpen && current) view = 'voting'
  else if (winnerPending && winner) view = 'result'
  else view = 'idle'

  // ---- voz: nueva ronda y resultado (solo si acaba de ocurrir; al recargar no se vuelve a leer) ----
  const spoken = useRef<{ open?: string; result?: string }>({})
  const songA = current?.songA ?? null
  const songB = current?.songB ?? null
  const nowMs = clock.nowMs
  useEffect(() => {
    if (!round) return
    if (view === 'voting' && songA && songB && spoken.current.open !== round.id) {
      spoken.current.open = round.id
      if (nowMs() - new Date(round.starts_at).getTime() < 15_000) {
        void speak(`Ya puedes votar desde tu celular. Opción A: ${songA.title}. Opción B: ${songB.title}.`)
      }
    }
    if (view === 'result' && winner && spoken.current.result !== round.id) {
      spoken.current.result = round.id
      if (nowMs() - new Date(round.ends_at).getTime() < 30_000) {
        const tie = round.resolution === 'empate' ? 'Hubo empate. ' : ''
        void speak(`Ronda cerrada. ${tie}Sigue ${winner.title}, de ${winner.artist}.`)
      }
    }
  }, [view, round, winner, songA, songB, nowMs, speak])

  // Cinta de avisos: clima, cómo votar y un recordatorio de la radio.
  const tickerItems = [
    ...(weather ? [`${weather.tempC} °C${weatherLabel(weather.code) ? ' · ' + weatherLabel(weather.code) : ''} en el campus`] : []),
    'Escanea el QR y vota la siguiente canción',
    'Radio Campus: tú decides qué suena después',
  ]

  const pct = percentages(round?.votes_a ?? 0, round?.votes_b ?? 0)
  const winnerOption: RoundOption | null =
    round?.winner_id === round?.option_a ? 'a' : round?.winner_id === round?.option_b ? 'b' : null
  const tally: TallyRow[] =
    current && round
      ? [
          { option: 'a', title: current.songA.title, votes: round.votes_a, percent: pct.a, isWinner: winnerOption === 'a' },
          { option: 'b', title: current.songB.title, votes: round.votes_b, percent: pct.b, isWinner: winnerOption === 'b' },
        ]
      : []

  const totalMs = round ? Math.max(1, new Date(round.ends_at).getTime() - new Date(round.starts_at).getTime()) : 1
  const roundProgress = countdown.remainingMs === null ? 0 : Math.min(1, countdown.remainingMs / totalMs)
  const songTotalMs = settings && nowSong ? playSeconds(nowSong, settings) * 1000 : 1
  const songProgress =
    songCountdown.remainingMs === null ? 0 : 1 - Math.min(1, songCountdown.remainingMs / Math.max(1, songTotalMs))

  return {
    view,
    nowSong,
    songA,
    songB,
    votesA: round?.votes_a ?? 0,
    votesB: round?.votes_b ?? 0,
    percentA: pct.a,
    percentB: pct.b,
    tally,
    winner,
    winnerOption,
    resolution: round?.resolution ?? null,
    timeLabel: countdown.remainingSec === null ? null : formatClock(countdown.remainingSec),
    urgent: countdown.remainingSec !== null && countdown.remainingSec > 0 && countdown.remainingSec <= 10,
    roundProgress,
    songProgress,
    songLeftLabel: songCountdown.remainingSec === null ? null : formatClock(songCountdown.remainingSec),
    paused: settings?.paused ?? false,
    attachPlayer: player.wrapRef,
    playerPlaying: player.status === 'playing',
    soundBlocked: player.status === 'blocked' || speech.blocked,
    unlockSound: () => {
      player.unlock()
      speech.unlock()
    },
    announcement,
    // /pantalla?debug=1 muestra el botón "Probar voz" (para revisar qué voz usa este navegador)
    debug: new URLSearchParams(window.location.search).get('debug') === '1',
    voiceName: speech.voiceName,
    testVoice: () => void speak('Hola, soy la voz de Radio Campus. Ya puedes votar desde tu celular.'),
    clockText,
    tickerItems,
    playerError: player.apiError,
    connection: live.connection,
    actionError,
    voteUrl: `${window.location.origin}/votar`,
    errorText: fatalError,
  }
}

export type PantallaModel = ReturnType<typeof usePantalla>
