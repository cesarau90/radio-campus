export type TieRule = 'aleatorio' | 'menos_reproducida' | 'opcion_a'
export type NoVotesRule = 'aleatorio' | 'respaldo'

/** Simulación de contexto que el admin guarda en settings.context_override; start_round la usa en lugar de la hora, el clima y el evento reales. */
export interface ContextOverride {
  hour?: number
  temp?: number
  /** 'ninguno' apaga también el evento real del calendario. */
  event_type?: 'festividad' | 'examenes' | 'evento' | 'ninguno'
  theme?: string
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
