/**
 * Acceso a datos: envuelve las llamadas a Supabase (tablas y RPC) sin lógica de negocio.
 * Toda la lógica vive en src/hooks; aquí solo se traduce `{ data, error }` a valores o errores.
 */
import { supabase } from './supabase'
import { ApiError, isAuthError } from './errors'
import { createAnonymousSession, ensureSession } from './session'
import type {
  Announcement,
  AnnouncementInput,
  CampusEvent,
  CampusEventInput,
  PlaybackPhase,
  PlaybackState,
  PlayHistoryRow,
  PlayStatus,
  Round,
  RoundOption,
  Settings,
  PreviewResult,
  Song,
  SongInput,
  VoteResult,
} from '../types'

function unwrap<T>(res: { data: T | null; error: { message: string; code?: string } | null; status?: number }): T {
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
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
  if (open.error) throw new ApiError(open.error.message, open.error.code, open.status)
  if (open.data) return open.data
  const last = await supabase
    .from('rounds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Round>()
  if (last.error) throw new ApiError(last.error.message, last.error.code, last.status)
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
  // Sin sesión, RLS devolvería "no hay voto" sin error: se confirma la sesión antes para no engañar a la pantalla.
  await ensureSession()
  const res = await supabase.from('votes').select('option').eq('round_id', roundId).maybeSingle<{ option: RoundOption }>()
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
  return res.data?.option ?? null
}

// ---------- RPC ----------

export async function fetchServerNow(): Promise<string> {
  return unwrap(await supabase.rpc('server_now')) as string
}

export async function fetchIsAdmin(): Promise<boolean> {
  return unwrap(await supabase.rpc('is_admin')) === true
}

/**
 * Emite el voto. Antes se confirma que haya sesión (si no, se crea una anónima). Si aun así el servidor responde
 * 401 / 42501 (la llamada salió sin JWT), se rehace la sesión anónima y se reintenta UNA vez. Nunca se le da permiso
 * a `anon` sobre cast_vote: el voto exige una sesión real.
 */
export async function castVote(roundId: string, option: RoundOption): Promise<VoteResult> {
  const call = async () =>
    unwrap(await supabase.rpc('cast_vote', { p_round_id: roundId, p_option: option })) as VoteResult
  await ensureSession()
  try {
    return await call()
  } catch (e) {
    if (!isAuthError(e)) throw e
    console.warn('[sesión] cast_vote respondió sin permiso; se rehace la sesión anónima y se reintenta una vez', e)
    await createAnonymousSession()
    return await call()
  }
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
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
}

export async function setPhase(phase: PlaybackPhase): Promise<void> {
  const res = await supabase.rpc('set_phase', { p_phase: phase })
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
}

/** El anuncio que toca ahora (el servidor decide vigencia, horario y frecuencia). */
export async function fetchNextAnnouncement(): Promise<Announcement | null> {
  const rows = unwrap(await supabase.rpc('next_announcement')) as Announcement[] | null
  return rows && rows.length > 0 ? rows[0] : null
}

export async function markAnnouncementPlayed(id: string): Promise<void> {
  const res = await supabase.rpc('mark_announcement_played', { p_id: id })
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
}

// ---------- admin: escrituras (la base solo las deja si is_admin(); RLS) ----------

/** Todas las canciones, también las restringidas e inactivas (RLS: el admin las ve todas). */
export async function fetchAllSongs(): Promise<Song[]> {
  return unwrap(await supabase.from('songs').select('*').order('title').returns<Song[]>())
}

export async function insertSong(input: SongInput): Promise<Song> {
  return unwrap(await supabase.from('songs').insert(input).select().single<Song>())
}

export async function updateSong(id: string, patch: Partial<SongInput>): Promise<Song> {
  return unwrap(await supabase.from('songs').update(patch).eq('id', id).select().single<Song>())
}

export async function deleteSong(id: string): Promise<void> {
  const res = await supabase.from('songs').delete().eq('id', id)
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
}

export async function fetchEvents(): Promise<CampusEvent[]> {
  return unwrap(await supabase.from('events').select('*').order('starts_at', { ascending: false }).returns<CampusEvent[]>())
}

export async function insertEvent(input: CampusEventInput): Promise<CampusEvent> {
  return unwrap(await supabase.from('events').insert(input).select().single<CampusEvent>())
}

export async function updateEvent(id: string, patch: Partial<CampusEventInput>): Promise<CampusEvent> {
  return unwrap(await supabase.from('events').update(patch).eq('id', id).select().single<CampusEvent>())
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await supabase.from('events').delete().eq('id', id)
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
}

export async function insertAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  return unwrap(await supabase.from('announcements').insert(input).select().single<Announcement>())
}

export async function updateAnnouncement(id: string, patch: Partial<AnnouncementInput>): Promise<Announcement> {
  return unwrap(await supabase.from('announcements').update(patch).eq('id', id).select().single<Announcement>())
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const res = await supabase.from('announcements').delete().eq('id', id)
  if (res.error) throw new ApiError(res.error.message, res.error.code, res.status)
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  return unwrap(await supabase.from('settings').update(patch).eq('id', 1).select().single<Settings>())
}

/** Las 2 canciones que el algoritmo ofrecería con un contexto dado (solo lectura, solo admin; no crea rondas). */
export async function previewPick(input: {
  hour: number | null
  temp: number | null
  eventType: string | null
  theme: string | null
}): Promise<PreviewResult> {
  return unwrap(
    await supabase.rpc('admin_preview_pick', {
      p_hour: input.hour,
      p_temp: input.temp,
      p_event_type: input.eventType,
      p_theme: input.theme,
    }),
  ) as PreviewResult
}

/** Reproducciones más recientes (RLS: solo el admin lee play_history). */
export async function fetchPlayHistory(limit: number): Promise<PlayHistoryRow[]> {
  return unwrap(
    await supabase.from('play_history').select('*').order('played_at', { ascending: false }).limit(limit).returns<PlayHistoryRow[]>(),
  )
}

/** Rondas cerradas más recientes, para la gráfica de votos. */
export async function fetchRecentClosedRounds(limit: number): Promise<Round[]> {
  return unwrap(
    await supabase.from('rounds').select('*').eq('status', 'closed').order('starts_at', { ascending: false }).limit(limit).returns<Round[]>(),
  )
}
