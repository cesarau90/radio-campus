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
  last_played_at: string | null
}
