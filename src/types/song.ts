export interface Song {
  id: string
  youtube_id: string
  title: string
  artist: string
  duration_sec: number
  genre: string
  energy: 1 | 2 | 3 | 4 | 5
  mood: string
  theme: string | null
  restricted: boolean
  restriction_note: string | null
  active: boolean
}

export type SongInput = Omit<Song, 'id'>
