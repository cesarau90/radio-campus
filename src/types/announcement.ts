export interface Announcement {
  id: string
  text: string
  approved: boolean
  active: boolean
  starts_at: string | null
  ends_at: string | null
  hour_from: number | null
  hour_to: number | null
  every_n_songs: number
  /** MP3 opcional (URL completa o ruta /audio/x.mp3). Sin él se usa la voz del navegador. */
  audio_url: string | null
  last_played_at: string | null
}

/** Lo que edita el admin; `id` y `last_played_at` los maneja la base. */
export type AnnouncementInput = Omit<Announcement, 'id' | 'last_played_at'>
