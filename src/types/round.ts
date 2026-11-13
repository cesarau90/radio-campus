import type { Song } from './song'

export type RoundStatus = 'open' | 'closed'
export type RoundResolution = 'votos' | 'empate' | 'sin_votos'
export type RoundOption = 'a' | 'b'
export type FallbackReason = 'sin_temperatura' | 'pocas_canciones'

/** Lo que guarda start_round en rounds.context_snapshot (lo muestra el monitor del admin). */
export interface ContextSnapshot {
  hour: number
  temp: number | null
  event_type: string | null
  event_theme: string | null
  event_name: string | null
  /** true si context_override (simulación) estaba activo. */
  overridden: boolean
  tz: string
  rule_names: string[]
  used_fallback: boolean
  fallback_reason: FallbackReason | null
  /** Canciones elegibles tras los filtros duros y suaves. */
  pool_size: number
  genres: string[] | null
  energy_min: number | null
  energy_max: number | null
  active_themes: string[]
  applied_moods: string[][]
  applied_themes: string[][]
  /** Segundos que sonará la canción en curso: min(duration_sec, max_play_sec). */
  play_sec: number
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

/** Ronda con sus dos canciones ya resueltas (las arma useLiveState). */
export interface RoundWithSongs {
  round: Round
  songA: Song
  songB: Song
}
