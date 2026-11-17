import {
  addSongToPlaylist,
  clearPlaylistSongs,
  fetchAllSongs,
  fetchAnnouncements,
  fetchEvents,
  fetchPlaylistLinks,
  fetchPlaylists,
  fetchRules,
  fetchSettings,
  insertAnnouncement,
  insertEvent,
  insertPlaylist,
  insertRule,
  setFallbackPlaylist,
  updateAnnouncement,
  updateEvent,
  updateRule,
  updateSettings,
} from './api'
import type { AnnouncementInput, CampusEventInput, ContextRuleInput, NoVotesRule, TieRule } from '../types'

export const BACKUP_VERSION = 1

/** Lo que se respalda de `settings`: la configuración de la radio. No incluye la pausa, la simulación ni el salto pendiente (son estados del momento). */
export interface BackupSettings {
  round_duration_sec: number
  max_play_sec: number
  tie_rule: TieRule
  no_votes_rule: NoVotesRule
  no_repeat_minutes: number
  lat: number
  lon: number
}

/** Las canciones de una playlist se guardan por `youtube_id` (los ids internos cambian de una base a otra). */
export interface BackupPlaylist {
  name: string
  is_fallback: boolean
  songs: Array<{ youtube_id: string; position: number }>
}

export interface Backup {
  app: 'radio-campus'
  version: number
  exported_at: string
  settings: BackupSettings
  context_rules: ContextRuleInput[]
  events: CampusEventInput[]
  announcements: AnnouncementInput[]
  playlists: BackupPlaylist[]
}

/** Lee de la base todo lo que se respalda. */
export async function buildBackup(): Promise<Backup> {
  const [settings, rules, events, announcements, playlists, links, songs] = await Promise.all([
    fetchSettings(),
    fetchRules(),
    fetchEvents(),
    fetchAnnouncements(),
    fetchPlaylists(),
    fetchPlaylistLinks(),
    fetchAllSongs(),
  ])
  const youtubeOf = new Map(songs.map((s) => [s.id, s.youtube_id]))
  return {
    app: 'radio-campus',
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    settings: {
      round_duration_sec: settings.round_duration_sec,
      max_play_sec: settings.max_play_sec,
      tie_rule: settings.tie_rule,
      no_votes_rule: settings.no_votes_rule,
      no_repeat_minutes: settings.no_repeat_minutes,
      lat: settings.lat,
      lon: settings.lon,
    },
    context_rules: rules.map(({ id: _id, created_at: _created, ...rest }) => rest),
    events: events.map(({ id: _id, ...rest }) => rest),
    announcements: announcements.map(({ id: _id, last_played_at: _last, ...rest }) => rest),
    playlists: playlists.map((p) => ({
      name: p.name,
      is_fallback: p.is_fallback,
      songs: links
        .filter((l) => l.playlist_id === p.id)
        .flatMap((l) => {
          const yt = youtubeOf.get(l.song_id)
          return yt ? [{ youtube_id: yt, position: l.position }] : []
        }),
    })),
  }
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; error: string }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Valida un archivo de respaldo antes de tocar la base: formato, versión y los datos mínimos de cada elemento. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' }
  }
  if (!isObj(data) || data.app !== 'radio-campus') return { ok: false, error: 'Este archivo no es un respaldo de Radio Campus.' }
  if (data.version !== BACKUP_VERSION) return { ok: false, error: `Versión de respaldo no compatible (${String(data.version)}). Se esperaba la ${BACKUP_VERSION}.` }
  for (const key of ['context_rules', 'events', 'announcements', 'playlists'] as const) {
    if (!Array.isArray(data[key])) return { ok: false, error: `Al respaldo le falta la lista "${key}".` }
  }
  const s = data.settings
  if (!isObj(s)) return { ok: false, error: 'Al respaldo le faltan los ajustes ("settings").' }
  const int = (v: unknown, min: number) => typeof v === 'number' && Number.isInteger(v) && v >= min
  if (!int(s.round_duration_sec, 10)) return { ok: false, error: 'Ajustes inválidos: la duración mínima de la ronda debe ser un entero de 10 en adelante.' }
  if (!int(s.max_play_sec, 0) || !int(s.no_repeat_minutes, 0)) return { ok: false, error: 'Ajustes inválidos: los segundos y minutos deben ser enteros de 0 en adelante.' }
  if (!['aleatorio', 'menos_reproducida', 'opcion_a'].includes(String(s.tie_rule)) || !['aleatorio', 'respaldo'].includes(String(s.no_votes_rule))) {
    return { ok: false, error: 'Ajustes inválidos: regla de empate o de "sin votos" desconocida.' }
  }
  if (typeof s.lat !== 'number' || Math.abs(s.lat) > 90 || typeof s.lon !== 'number' || Math.abs(s.lon) > 180) {
    return { ok: false, error: 'Ajustes inválidos: latitud o longitud fuera de rango.' }
  }
  const named = (arr: unknown[], field: string) => arr.every((x) => isObj(x) && typeof x[field] === 'string' && (x[field] as string).trim() !== '')
  if (!named(data.context_rules as unknown[], 'name')) return { ok: false, error: 'Hay reglas sin nombre en el respaldo.' }
  if (!named(data.events as unknown[], 'name')) return { ok: false, error: 'Hay eventos sin nombre en el respaldo.' }
  if (!named(data.announcements as unknown[], 'text')) return { ok: false, error: 'Hay anuncios sin texto en el respaldo.' }
  if (!named(data.playlists as unknown[], 'name')) return { ok: false, error: 'Hay playlists sin nombre en el respaldo.' }
  if (!(data.playlists as Array<Record<string, unknown>>).every((p) => Array.isArray(p.songs))) {
    return { ok: false, error: 'Hay playlists sin la lista de canciones en el respaldo.' }
  }
  return { ok: true, backup: data as unknown as Backup }
}

/** Resumen corto de lo que trae un respaldo, para mostrarlo antes de importar. */
export function summarizeBackup(b: Backup): string {
  const songs = b.playlists.reduce((n, p) => n + p.songs.length, 0)
  const fallback = b.playlists.find((p) => p.is_fallback)
  return `${b.context_rules.length} reglas, ${b.events.length} eventos, ${b.announcements.length} anuncios, ${b.playlists.length} playlists (${songs} canciones${fallback ? `; respaldo: "${fallback.name}"` : ''}) y los ajustes de la radio. Exportado el ${b.exported_at.slice(0, 10)}.`
}

export interface RestoreReport {
  ajustes: boolean
  reglas: { creadas: number; actualizadas: number }
  eventos: { creados: number; actualizados: number }
  anuncios: { creados: number; actualizados: number }
  playlists: { creadas: number; actualizadas: number; cancionesVinculadas: number }
  avisos: string[]
}

const key = (v: string) => v.trim().toLowerCase()

/**
 * Restaura un respaldo SIN borrar nada: lo que ya existe con el mismo nombre (reglas, eventos, playlists) o el mismo texto (anuncios)
 * se sobrescribe y lo que falta se crea; lo demás no se toca. Las canciones de cada playlist del archivo se reemplazan por las del archivo
 * (se buscan por `youtube_id`; las que no estén en el catálogo se avisan y se omiten). Las canciones no se respaldan: viven en el seed y en /admin.
 */
export async function restoreBackup(b: Backup): Promise<RestoreReport> {
  const report: RestoreReport = {
    ajustes: false,
    reglas: { creadas: 0, actualizadas: 0 },
    eventos: { creados: 0, actualizados: 0 },
    anuncios: { creados: 0, actualizados: 0 },
    playlists: { creadas: 0, actualizadas: 0, cancionesVinculadas: 0 },
    avisos: [],
  }

  await updateSettings(b.settings)
  report.ajustes = true

  const rules = new Map((await fetchRules()).map((r) => [key(r.name), r.id]))
  for (const r of b.context_rules) {
    const id = rules.get(key(r.name))
    if (id) {
      await updateRule(id, r)
      report.reglas.actualizadas++
    } else {
      await insertRule(r)
      report.reglas.creadas++
    }
  }

  const events = new Map((await fetchEvents()).map((e) => [key(e.name), e.id]))
  for (const e of b.events) {
    const id = events.get(key(e.name))
    if (id) {
      await updateEvent(id, e)
      report.eventos.actualizados++
    } else {
      await insertEvent(e)
      report.eventos.creados++
    }
  }

  const anns = new Map((await fetchAnnouncements()).map((a) => [key(a.text), a.id]))
  for (const a of b.announcements) {
    const id = anns.get(key(a.text))
    if (id) {
      await updateAnnouncement(id, a)
      report.anuncios.actualizados++
    } else {
      await insertAnnouncement(a)
      report.anuncios.creados++
    }
  }

  const songIdByYoutube = new Map((await fetchAllSongs()).map((s) => [s.youtube_id, s.id]))
  const existing = new Map((await fetchPlaylists()).map((p) => [key(p.name), p.id]))
  let fallbackId: string | null = null
  for (const p of b.playlists) {
    let id = existing.get(key(p.name))
    if (id) {
      report.playlists.actualizadas++
    } else {
      id = (await insertPlaylist(p.name)).id
      report.playlists.creadas++
    }
    await clearPlaylistSongs(id)
    let position = 0
    for (const s of [...p.songs].sort((x, y) => x.position - y.position)) {
      const songId = songIdByYoutube.get(s.youtube_id)
      if (!songId) {
        report.avisos.push(`"${p.name}": la canción ${s.youtube_id} no está en el catálogo y se omitió.`)
        continue
      }
      position += 1
      await addSongToPlaylist(id, songId, position)
      report.playlists.cancionesVinculadas++
    }
    if (p.is_fallback) fallbackId = id
  }
  if (fallbackId) await setFallbackPlaylist(fallbackId)

  return report
}
