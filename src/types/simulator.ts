import type { Song } from './song'

/** Lo que devuelve admin_preview_pick: el contexto usado, cómo se eligió y las dos canciones. */
export interface PreviewResult {
  context: {
    hour: number
    temp: number | null
    event_type: string | null
    event_theme: string | null
  }
  pick: {
    rule_names: string[]
    used_fallback: boolean
    fallback_reason: 'sin_temperatura' | 'pocas_canciones' | null
    pool_size: number
    genres: string[] | null
    energy_min: number | null
    energy_max: number | null
    applied_moods: string[][]
    applied_themes: string[][]
    active_themes?: string[]
  }
  song_a: Song | null
  song_b: Song | null
}
