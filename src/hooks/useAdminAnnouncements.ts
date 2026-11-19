import { useCallback, useEffect, useState } from 'react'
import { deleteAnnouncement, fetchAnnouncements, insertAnnouncement, updateAnnouncement } from '../lib/api'
import { fromLocalInput, toLocalInput } from '../lib/datetime'
import type { Announcement, AnnouncementInput } from '../types'
import { useEditFocus } from './useEditFocus'

export const MAX_TEXT = 280

export interface AnnouncementDraft {
  text: string
  approved: boolean
  active: boolean
  starts: string
  ends: string
  hour_from: string
  hour_to: string
  every_n_songs: string
  audio_url: string
}

export type AnnouncementField = keyof AnnouncementDraft

const EMPTY: AnnouncementDraft = { text: '', approved: false, active: true, starts: '', ends: '', hour_from: '', hour_to: '', every_n_songs: '3', audio_url: '' }

const isHour = (v: string) => /^\d{1,2}$/.test(v.trim()) && Number(v) >= 0 && Number(v) <= 23

export function validateAnnouncement(d: AnnouncementDraft): Partial<Record<AnnouncementField, string>> {
  const e: Partial<Record<AnnouncementField, string>> = {}
  if (!d.text.trim()) e.text = 'Escribe lo que se va a decir.'
  else if (d.text.length > MAX_TEXT) e.text = `Máximo ${MAX_TEXT} caracteres (para que no se haga eterno).`
  if (!/^\d+$/.test(d.every_n_songs.trim()) || Number(d.every_n_songs) < 1) e.every_n_songs = 'Un número entero, de 1 en adelante.'
  const hf = d.hour_from.trim()
  const ht = d.hour_to.trim()
  if (hf && !isHour(hf)) e.hour_from = 'Una hora de 0 a 23.'
  if (ht && !isHour(ht)) e.hour_to = 'Una hora de 0 a 23.'
  if (!e.hour_from && !e.hour_to && !!hf !== !!ht) e.hour_to = 'Pon las dos horas o ninguna.'
  const au = d.audio_url.trim()
  if (au && !/^(\/|https?:\/\/)\S+$/.test(au)) e.audio_url = 'Una URL completa (https://…) o una ruta como /audio/anuncio.mp3.'
  const a = fromLocalInput(d.starts)
  const b = fromLocalInput(d.ends)
  if (d.starts && !a) e.starts = 'Fecha inválida.'
  if (d.ends && !b) e.ends = 'Fecha inválida.'
  if (a && b && new Date(b) <= new Date(a)) e.ends = 'Debe terminar después de empezar.'
  return e
}

function toDraft(a: Announcement): AnnouncementDraft {
  return {
    text: a.text,
    approved: a.approved,
    active: a.active,
    starts: toLocalInput(a.starts_at),
    ends: toLocalInput(a.ends_at),
    hour_from: a.hour_from === null ? '' : String(a.hour_from),
    hour_to: a.hour_to === null ? '' : String(a.hour_to),
    every_n_songs: String(a.every_n_songs),
    audio_url: a.audio_url ?? '',
  }
}

function toInput(d: AnnouncementDraft): AnnouncementInput {
  return {
    text: d.text.trim(),
    approved: d.approved,
    active: d.active,
    starts_at: fromLocalInput(d.starts),
    ends_at: fromLocalInput(d.ends),
    hour_from: d.hour_from.trim() === '' ? null : Number(d.hour_from),
    hour_to: d.hour_to.trim() === '' ? null : Number(d.hour_to),
    every_n_songs: Number(d.every_n_songs),
    audio_url: d.audio_url.trim() || null,
  }
}

export type AnnouncementStatus = 'al-aire' | 'sin-aprobar' | 'apagado' | 'fuera-de-fecha'

/** Si /pantalla lo puede leer ahora (aprobado, activo y dentro de sus fechas). El horario y la frecuencia los decide el servidor. */
export function announcementStatus(a: Announcement, nowMs: number): AnnouncementStatus {
  if (!a.approved) return 'sin-aprobar'
  if (!a.active) return 'apagado'
  if (a.starts_at && nowMs < new Date(a.starts_at).getTime()) return 'fuera-de-fecha'
  if (a.ends_at && nowMs >= new Date(a.ends_at).getTime()) return 'fuera-de-fecha'
  return 'al-aire'
}

/**
 * Anuncios de la radio. /pantalla solo lee los que están aprobados y activos (RLS y next_announcement);
 * aquí se aprueban, se apagan, se programan (fechas, horario, cada cuántas canciones) y se prueba su voz.
 */
export function useAdminAnnouncements(enabled: boolean, speak: (text: string) => Promise<void>) {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  useEditFocus(editingId)
  const [draft, setDraft] = useState<AnnouncementDraft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await fetchAnnouncements())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [enabled, load])

  const startNew = useCallback(() => {
    setEditingId('new')
    setDraft(EMPTY)
    setFormError(null)
  }, [])

  const startEdit = useCallback((a: Announcement) => {
    setEditingId(a.id)
    setDraft(toDraft(a))
    setFormError(null)
  }, [])

  const cancel = useCallback(() => {
    setEditingId(null)
    setFormError(null)
  }, [])

  const setField = useCallback(<K extends AnnouncementField>(field: K, value: AnnouncementDraft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }, [])

  const errors = editingId ? validateAnnouncement(draft) : {}

  const save = useCallback(async () => {
    if (!editingId || Object.keys(validateAnnouncement(draft)).length > 0) return
    setSaving(true)
    setFormError(null)
    try {
      if (editingId === 'new') await insertAnnouncement(toInput(draft))
      else await updateAnnouncement(editingId, toInput(draft))
      setEditingId(null)
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }, [editingId, draft, load])

  const patch = useCallback(
    async (a: Announcement, change: Partial<Pick<AnnouncementInput, 'approved' | 'active'>>) => {
      try {
        await updateAnnouncement(a.id, change)
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [load],
  )

  const toggleApproved = useCallback((a: Announcement) => patch(a, { approved: !a.approved }), [patch])
  const toggleActive = useCallback((a: Announcement) => patch(a, { active: !a.active }), [patch])
  const preview = useCallback((text: string) => void speak(text), [speak])

  const askDelete = useCallback((id: string | null) => setDeleteId(id), [])

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteAnnouncement(deleteId)
      setDeleteId(null)
      await load()
    } catch (e) {
      setDeleteId(null)
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [deleteId, load])

  return {
    items,
    loading,
    error,
    editingId,
    draft,
    errors,
    saving,
    formError,
    deleteId,
    startNew,
    startEdit,
    cancel,
    setField,
    save,
    toggleApproved,
    toggleActive,
    preview,
    askDelete,
    confirmDelete,
  }
}

export type AdminAnnouncementsModel = ReturnType<typeof useAdminAnnouncements>
