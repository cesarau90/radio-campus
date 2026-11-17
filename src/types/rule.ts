import type { EventType } from './event'

/** Regla contextual (tabla context_rules). Mayor `priority` gana. Un `null` significa "no condiciona" o "no restringe". */
export interface ContextRule {
  id: string
  name: string
  priority: number
  active: boolean
  // condiciones
  hour_from: number | null
  hour_to: number | null
  temp_min: number | null
  temp_max: number | null
  event_type: EventType | null
  // efectos
  allowed_genres: string[] | null
  energy_min: number | null
  energy_max: number | null
  moods: string[] | null
  themes: string[] | null
  created_at: string
}

export type ContextRuleInput = Omit<ContextRule, 'id' | 'created_at'>

export interface Playlist {
  id: string
  name: string
  is_fallback: boolean
  created_at: string
}

export interface PlaylistSong {
  playlist_id: string
  song_id: string
  position: number
}
