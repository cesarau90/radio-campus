export type PlaybackPhase = 'idle' | 'playing' | 'result' | 'announcement' | 'error'

/** Fila única de playback_state: qué suena ahora. La escribe /pantalla vía record_play y set_phase. */
export interface PlaybackState {
  id: number
  current_song_id: string | null
  current_round_id: string | null
  phase: PlaybackPhase
  started_at: string | null
  updated_at: string
}

export type PlayStatus = 'ok' | 'error' | 'skipped'
