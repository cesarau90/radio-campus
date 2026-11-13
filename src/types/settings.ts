export type TieRule = 'aleatorio' | 'menos_reproducida' | 'opcion_a'
export type NoVotesRule = 'aleatorio' | 'respaldo'

export interface ContextOverride {
  hour?: number
  temp?: number
  event_type?: 'festividad' | 'examenes' | 'evento'
}

export interface Settings {
  id: number
  /** Mínimo de segundos que dura una ronda. */
  round_duration_sec: number
  /** 0 = canción completa; >0 corta la canción con fade-out. */
  max_play_sec: number
  tie_rule: TieRule
  no_votes_rule: NoVotesRule
  no_repeat_minutes: number
  paused: boolean
  lat: number
  lon: number
  context_override: ContextOverride | null
  /** El admin pide saltar la canción; /pantalla reacciona al cambio. */
  skip_requested_at: string | null
}
