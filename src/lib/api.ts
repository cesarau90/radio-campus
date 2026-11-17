/**
 * Acceso a datos: envuelve las llamadas a Supabase (tablas y RPC) sin lógica de negocio.
 * Toda la lógica vive en src/hooks; aquí solo se traduce `{ data, error }` a valores o errores.
 */
import { supabase } from './supabase'
import type {
  Announcement,
  PlaybackPhase,
  PlaybackState,
  PlayStatus,
  Round,
  RoundOption,
  Settings,
  Song,
  VoteResult,
} from '../types'

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

// ---------- lecturas ----------

export async function fetchSettings(): Promise<Settings> {
  return unwrap(await supabase.from('settings').select('*').eq('id', 1).single<Settings>())
}

export async function fetchPlaybackState(): Promise<PlaybackState> {
  return unwrap(await supabase.from('playback_state').select('*').eq('id', 1).single<PlaybackState>())
}

/** La ronda abierta; si no hay, la más reciente (para mostrar el resultado). */
export async function fetchCurrentRound(): Promise<Round | null> {
  const open = await supabase.from('rounds').select('*').eq('status', 'open').maybeSingle<Round>()
  if (open.error) throw new Error(open.error.message)
  if (open.data) return open.data
  const last = await supabase
    .from('rounds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Round>()
  if (last.error) throw new Error(last.error.message)
  return last.data
}

export async function fetchSongsByIds(ids: string[]): Promise<Song[]> {
  if (ids.length === 0) return []
  return unwrap(await supabase.from('songs').select('*').in('id', ids).returns<Song[]>())
}

/**
 * Canción para arrancar la radio cuando todavía no ha sonado nada. La playlist de respaldo solo la lee el admin (RLS),
 * así que se elige al azar entre canciones tranquilas, activas y sin tema (las restringidas ya las filtra RLS).
 */
export async function fetchStarterSong(): Promise<Song> {
  const rows = unwrap(
    await supabase
      .from('songs')
      .select('*')
      .eq('active', true)
      .eq('restricted', false)
      .is('theme', null)
      .lte('energy', 3)
      .limit(60)
      .returns<Song[]>(),
  )
  if (!rows || rows.length === 0) throw new Error('No hay canciones disponibles para arrancar la radio.')
  return rows[Math.floor(Math.random() * rows.length)]
}

/** Anuncios aprobados y activos (RLS ya filtra el resto). La vigencia y el horario los decide next_announcement. */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  return unwrap(
    await supabase.from('announcements').select('*').order('created_at', { ascending: false }).returns<Announcement[]>(),
  )
}

/** El voto del usuario actual en una ronda (RLS solo deja ver el propio). */
export async function fetchMyVote(roundId: string): Promise<RoundOption | null> {
  const res = await supabase.from('votes').select('option').eq('round_id', roundId).maybeSingle<{ option: RoundOption }>()
  if (res.error) throw new Error(res.error.message)
  return res.data?.option ?? null
}

// ---------- RPC ----------

export async function fetchServerNow(): Promise<string> {
  return unwrap(await supabase.rpc('server_now')) as string
}

export async function fetchIsAdmin(): Promise<boolean> {
  return unwrap(await supabase.rpc('is_admin')) === true
}

export async function castVote(roundId: string, option: RoundOption): Promise<VoteResult> {
  return unwrap(await supabase.rpc('cast_vote', { p_round_id: roundId, p_option: option })) as VoteResult
}

export async function startRound(temp: number | null): Promise<Round> {
  return unwrap(await supabase.rpc('start_round', { p_temp: temp })) as Round
}

export async function closeRound(roundId: string): Promise<Round> {
  return unwrap(await supabase.rpc('close_round', { p_round_id: roundId })) as Round
}

export async function adminForceCloseRound(roundId: string): Promise<Round> {
  return unwrap(await supabase.rpc('admin_force_close_round', { p_round_id: roundId })) as Round
}

export async function recordPlay(input: {
  songId: string
  roundId?: string | null
  status?: PlayStatus
  note?: string | null
}): Promise<void> {
  const res = await supabase.rpc('record_play', {
    p_song_id: input.songId,
    p_round_id: input.roundId ?? null,
    p_status: input.status ?? 'ok',
    p_note: input.note ?? null,
  })
  if (res.error) throw new Error(res.error.message)
}

export async function setPhase(phase: PlaybackPhase): Promise<void> {
  const res = await supabase.rpc('set_phase', { p_phase: phase })
  if (res.error) throw new Error(res.error.message)
}

/** El anuncio que toca ahora (el servidor decide vigencia, horario y frecuencia). */
export async function fetchNextAnnouncement(): Promise<Announcement | null> {
  const rows = unwrap(await supabase.rpc('next_announcement')) as Announcement[] | null
  return rows && rows.length > 0 ? rows[0] : null
}

export async function markAnnouncementPlayed(id: string): Promise<void> {
  const res = await supabase.rpc('mark_announcement_played', { p_id: id })
  if (res.error) throw new Error(res.error.message)
}
