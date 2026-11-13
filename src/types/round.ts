import type { Song } from './song'

export type RoundStatus = 'open' | 'closed'
export type RoundResolution = 'votos' | 'empate' | 'sin_votos'
export type RoundOption = 'a' | 'b'

export interface ContextSnapshot {
  hour: number
  temp: number | null
  event_type: string | null
  rule_names: string[]
  used_fallback: boolean
  overridden: boolean
}

export interface Round {
  id: string
  option_a: string
  option_b: string
  starts_at: string
  ends_at: string
  status: RoundStatus
  votes_a: number
  votes_b: number
  winner_id: string | null
  resolution: RoundResolution | null
  context_snapshot: ContextSnapshot | null
}

/** Ronda con sus dos canciones ya resueltas (las arma un hook). */
export interface RoundWithSongs {
  round: Round
  songA: Song
  songB: Song
}
