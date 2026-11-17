import { useCallback, useEffect, useState } from 'react'
import { castVote, fetchMyVote } from '../lib/api'
import { useAnonymousSession } from './useAnonymousSession'
import { useServerClock } from './useServerClock'
import { useLiveState } from './useLiveState'
import { useCountdown } from './useCountdown'
import { formatClock, spokenDuration } from '../lib/time'
import { percentages } from '../lib/votes'
import type { RoundOption, Song, TallyRow, VotarView } from '../types'

interface Picked {
  roundId: string
  option: RoundOption
}

/**
 * Hook principal de /votar: toda la lógica de la pantalla del votante.
 * Devuelve un modelo de vista listo para pintar; la página y los componentes solo lo reciben por props.
 * El servidor decide si un voto cuenta (cast_vote); aquí solo se ordena la experiencia.
 */
export function useVotar() {
  const session = useAnonymousSession()
  const clock = useServerClock(session.ready)
  const live = useLiveState(session.ready)

  const current = live.current
  const roundId = current?.round.id ?? null
  const roundOpen = current?.round.status === 'open'

  const countdown = useCountdown(current?.round.ends_at ?? null, clock.nowMs, clock.ready && roundOpen)

  // Mi voto en la ronda actual (también tras recargar: se consulta a la base, RLS solo deja ver el propio).
  const [mine, setMine] = useState<Picked | null>(null)
  // Qué opción tengo seleccionada sin confirmar. Va ligada a la ronda: al cambiar de ronda se descarta sola.
  const [selected, setSelected] = useState<Picked | null>(null)
  // Ronda en la que voté en esta sesión de pantalla (para sellar con animación solo al votar, no al recargar).
  const [stampedRound, setStampedRound] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)

  useEffect(() => {
    if (!roundId || !session.ready) return
    let cancelled = false
    fetchMyVote(roundId).then(
      (option) => {
        if (!cancelled && option) setMine({ roundId, option })
      },
      () => {
        /* si falla, se enterará al votar: cast_vote responde "ya votaste" */
      },
    )
    return () => {
      cancelled = true
    }
  }, [roundId, session.ready])

  const myOption = mine && mine.roundId === roundId ? mine.option : null
  const selectedOption = selected && selected.roundId === roundId ? selected.option : null

  const select = useCallback(
    (option: RoundOption) => {
      if (!roundId || submitting) return
      setVoteError(null)
      setSelected({ roundId, option })
    },
    [roundId, submitting],
  )

  const vote = useCallback(async () => {
    if (!roundId || !selectedOption || submitting) return
    setSubmitting(true)
    setVoteError(null)
    try {
      const res = await castVote(roundId, selectedOption)
      if (res.status === 'voted') {
        setMine({ roundId, option: selectedOption })
        setStampedRound(roundId)
      } else if (res.status === 'already_voted') {
        // Otra pestaña o un voto anterior: se respeta lo que tiene el servidor.
        setMine({ roundId, option: res.option ?? selectedOption })
      } else if (res.status === 'closed') {
        setVoteError('La ronda cerró justo antes de que llegara tu voto.')
        void live.refresh()
      } else {
        setVoteError('Esa ronda ya no existe. Espera la siguiente.')
        void live.refresh()
      }
    } catch {
      setVoteError('No se pudo enviar tu voto. Revisa tu conexión e inténtalo otra vez.')
    } finally {
      setSubmitting(false)
    }
  }, [roundId, selectedOption, submitting, live])

  // ---- qué pantalla toca ----
  const fatalError = session.error ?? (live.error && !live.settings ? live.error : null)
  let view: VotarView
  if (fatalError) view = 'error'
  else if (!session.ready || live.loading || !clock.ready) view = 'connecting'
  else if (!live.round) view = 'no-round'
  else if (!current) view = 'connecting' // la ronda ya llegó, faltan sus canciones
  else if (current.round.status === 'closed') view = 'closed'
  else if (countdown.expired) view = 'counting'
  else if (myOption) view = 'voted'
  else view = 'voting'

  // ---- datos derivados para la vista ----
  const round = current?.round ?? null
  const totalMs = round ? Math.max(1, new Date(round.ends_at).getTime() - new Date(round.starts_at).getTime()) : 1
  const progress = countdown.remainingMs === null ? 0 : Math.min(1, countdown.remainingMs / totalMs)

  const winner = round?.winner_id ? (live.songs[round.winner_id] ?? null) : null
  const winnerOption: RoundOption | null =
    round && round.winner_id ? (round.winner_id === round.option_a ? 'a' : round.winner_id === round.option_b ? 'b' : null) : null

  // Recuento final (solo se usa con la ronda cerrada): votos y porcentaje de A y B, con la ganadora marcada.
  const pct = percentages(round?.votes_a ?? 0, round?.votes_b ?? 0)
  const tally: TallyRow[] =
    current && round
      ? [
          { option: 'a', title: current.songA.title, votes: round.votes_a, percent: pct.a, isWinner: winnerOption === 'a' },
          { option: 'b', title: current.songB.title, votes: round.votes_b, percent: pct.b, isWinner: winnerOption === 'b' },
        ]
      : []

  // Contador en mm:ss. Solo hay cuenta mientras la ronda está abierta y el reloj del servidor está listo.
  const secondsLeft = countdown.remainingSec
  const timeLabel = secondsLeft === null ? null : formatClock(secondsLeft)
  const timeSpoken = secondsLeft === null ? null : spokenDuration(secondsLeft)
  const urgent = secondsLeft !== null && secondsLeft > 0 && secondsLeft <= 10

  // "Sonando ahora": playback_state.current_song_id lo escribe /pantalla (Fase 6). Mientras no haya dato, es null
  // y las vistas simplemente no pintan la sección.
  const phase = live.playback?.phase ?? 'idle'
  const nowPlayingId = live.playback?.current_song_id ?? null
  const nowPlaying: Song | null =
    nowPlayingId && phase !== 'idle' && phase !== 'error' ? (live.songs[nowPlayingId] ?? null) : null

  const retry = useCallback(() => {
    session.retry()
    void live.refresh()
  }, [session, live])

  return {
    view,
    errorMessage: fatalError,
    songA: current?.songA ?? null,
    songB: current?.songB ?? null,
    selectedOption,
    myOption,
    /** true solo si votó en esta visita (el sello se anima); false si ya había votado antes. */
    justVoted: roundId !== null && stampedRound === roundId,
    submitting,
    voteError,
    timeLabel,
    timeSpoken,
    urgent,
    progress,
    nowPlaying,
    connection: live.connection,
    result: round
      ? { votesA: round.votes_a, votesB: round.votes_b, resolution: round.resolution, winner, winnerOption, tally }
      : null,
    select,
    vote,
    retry,
  }
}

export type VotarModel = ReturnType<typeof useVotar>
