import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteSong, fetchAllSongs, insertSong, updateSong } from '../lib/api'
import { cleanAuthor, extractVideoId, fetchDuration, fetchOEmbed } from '../lib/youtube'
import type { Song, SongInput } from '../types'

export type SongFilter = 'todas' | 'activas' | 'inactivas' | 'restringidas'

export interface SongDraft {
  /** Enlace o ID de YouTube (solo al agregar). */
  youtube: string
  title: string
  artist: string
  duration: string
  genre: string
  energy: string
  mood: string
  theme: string
  restricted: boolean
  restriction_note: string
  active: boolean
}

export type SongField = keyof SongDraft
export type LookupState = { status: 'idle' | 'checking' | 'ok' | 'error'; message: string }

const EMPTY: SongDraft = {
  youtube: '',
  title: '',
  artist: '',
  duration: '',
  genre: '',
  energy: '3',
  mood: '',
  theme: '',
  restricted: false,
  restriction_note: '',
  active: true,
}

function toDraft(s: Song): SongDraft {
  return {
    youtube: s.youtube_id,
    title: s.title,
    artist: s.artist,
    duration: String(s.duration_sec),
    genre: s.genre,
    energy: String(s.energy),
    mood: s.mood,
    theme: s.theme ?? '',
    restricted: s.restricted,
    restriction_note: s.restriction_note ?? '',
    active: s.active,
  }
}

/** Los mismos requisitos que la tabla songs, para avisar antes de enviar. `isNew` exige un enlace/ID válido. */
export function validateSong(d: SongDraft, isNew: boolean): Partial<Record<SongField, string>> {
  const e: Partial<Record<SongField, string>> = {}
  if (isNew && !extractVideoId(d.youtube)) e.youtube = 'Pega un enlace de YouTube o el ID de 11 caracteres.'
  if (!d.title.trim()) e.title = 'Falta el título.'
  if (!d.genre.trim()) e.genre = 'Falta el género.'
  if (!d.mood.trim()) e.mood = 'Falta el ánimo.'
  if (!/^[1-5]$/.test(d.energy)) e.energy = 'De 1 (tranquila) a 5 (muy movida).'
  if (!/^\d+$/.test(d.duration.trim())) e.duration = 'Segundos, un número entero (0 si no se sabe).'
  return e
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/duplicate key|songs_youtube_id_key/i.test(msg)) return 'Esa canción ya está en el catálogo.'
  if (/foreign key|violates/i.test(msg)) return 'Esa canción ya salió en alguna ronda: no se puede borrar. Desactívala para que no vuelva a salir.'
  return msg
}

/** Catálogo de canciones: lista con búsqueda y filtro, alta con comprobación en YouTube, edición, activar/restringir y borrar. */
export function useAdminSongs(enabled: boolean) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<SongFilter>('todas')

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<SongDraft>(EMPTY)
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle', message: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setSongs(await fetchAllSongs())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    // Carga inicial: el setState ocurre después del await (no es síncrono en el efecto).
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [enabled, load])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return songs.filter((s) => {
      if (q && !`${s.title} ${s.artist} ${s.genre} ${s.mood} ${s.theme ?? ''}`.toLowerCase().includes(q)) return false
      if (filter === 'activas') return s.active && !s.restricted
      if (filter === 'inactivas') return !s.active
      if (filter === 'restringidas') return s.restricted
      return true
    })
  }, [songs, search, filter])

  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const song of songs) if (song.theme) counts[song.theme] = (counts[song.theme] ?? 0) + 1
    return counts
  }, [songs])

  const suggestions = useMemo(() => {
    const uniq = (vals: Array<string | null>) => [...new Set(vals.filter((v): v is string => !!v))].sort()
    return {
      genres: uniq(songs.map((s) => s.genre)),
      moods: uniq(songs.map((s) => s.mood)),
      themes: uniq(songs.map((s) => s.theme)),
    }
  }, [songs])

  const startNew = useCallback(() => {
    setEditingId('new')
    setDraft(EMPTY)
    setLookup({ status: 'idle', message: '' })
    setFormError(null)
  }, [])

  const startEdit = useCallback((s: Song) => {
    setEditingId(s.id)
    setDraft(toDraft(s))
    setLookup({ status: 'idle', message: '' })
    setFormError(null)
  }, [])

  const cancel = useCallback(() => {
    setEditingId(null)
    setFormError(null)
  }, [])

  const setField = useCallback(<K extends SongField>(field: K, value: SongDraft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }, [])

  /** Comprueba el video en YouTube y rellena título, canal y duración (sin pisar lo que ya escribiste). */
  const check = useCallback(async () => {
    const id = extractVideoId(draft.youtube)
    if (!id) {
      setLookup({ status: 'error', message: 'Pega un enlace de YouTube o el ID de 11 caracteres.' })
      return
    }
    setLookup({ status: 'checking', message: 'Comprobando en YouTube…' })
    try {
      const info = await fetchOEmbed(id)
      setDraft((d) => ({ ...d, title: d.title || info.title, artist: d.artist || cleanAuthor(info.author) }))
      let message = 'Video válido: se puede reproducir.'
      try {
        const sec = await fetchDuration(id)
        setDraft((d) => ({ ...d, duration: String(sec) }))
        message = `Video válido: se puede reproducir. Duración ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}.`
      } catch {
        message = 'Video válido, pero no se pudo leer la duración: escríbela a mano (segundos).'
      }
      setLookup({ status: 'ok', message })
    } catch (e) {
      setLookup({ status: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }, [draft.youtube])

  const errors = editingId ? validateSong(draft, editingId === 'new') : {}

  const save = useCallback(async () => {
    if (!editingId || Object.keys(validateSong(draft, editingId === 'new')).length > 0) return
    setSaving(true)
    setFormError(null)
    const fields = {
      title: draft.title.trim(),
      artist: draft.artist.trim(),
      duration_sec: Number(draft.duration),
      genre: draft.genre.trim(),
      energy: Number(draft.energy) as SongInput['energy'],
      mood: draft.mood.trim(),
      theme: draft.theme.trim() || null,
      restricted: draft.restricted,
      restriction_note: draft.restricted ? draft.restriction_note.trim() || null : null,
      active: draft.active,
    }
    try {
      if (editingId === 'new') {
        await insertSong({ ...fields, youtube_id: extractVideoId(draft.youtube)! })
      } else {
        await updateSong(editingId, fields)
      }
      setEditingId(null)
      await load()
    } catch (e) {
      setFormError(friendlyError(e))
    } finally {
      setSaving(false)
    }
  }, [editingId, draft, load])

  const toggleActive = useCallback(
    async (s: Song) => {
      try {
        await updateSong(s.id, { active: !s.active })
        await load()
      } catch (e) {
        setError(friendlyError(e))
      }
    },
    [load],
  )

  const askDelete = useCallback((id: string | null) => setDeleteId(id), [])

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteSong(deleteId)
      setDeleteId(null)
      await load()
    } catch (e) {
      setDeleteId(null)
      setError(friendlyError(e))
    }
  }, [deleteId, load])

  return {
    songs: visible,
    total: songs.length,
    loading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    suggestions,
    themeCounts,
    editingId,
    draft,
    errors,
    lookup,
    saving,
    formError,
    deleteId,
    startNew,
    startEdit,
    cancel,
    setField,
    check,
    save,
    toggleActive,
    askDelete,
    confirmDelete,
  }
}

export type AdminSongsModel = ReturnType<typeof useAdminSongs>
