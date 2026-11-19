import { useCallback, useEffect, useState } from 'react'
import { deleteEvent, fetchEvents, insertEvent, updateEvent } from '../lib/api'
import { fromLocalInput, toLocalInput } from '../lib/datetime'
import type { CampusEvent, EventType } from '../types'
import { useEditFocus } from './useEditFocus'

export interface EventDraft {
  name: string
  type: EventType
  starts: string
  ends: string
  theme: string
}

export type EventField = keyof EventDraft

export const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: 'festividad', label: 'Festividad' },
  { value: 'examenes', label: 'Exámenes' },
  { value: 'evento', label: 'Evento del campus' },
]

const EMPTY: EventDraft = { name: '', type: 'evento', starts: '', ends: '', theme: '' }

export function validateEvent(d: EventDraft): Partial<Record<EventField, string>> {
  const e: Partial<Record<EventField, string>> = {}
  if (!d.name.trim()) e.name = 'Falta el nombre.'
  const a = fromLocalInput(d.starts)
  const b = fromLocalInput(d.ends)
  if (!a) e.starts = 'Elige cuándo empieza.'
  if (!b) e.ends = 'Elige cuándo termina.'
  if (a && b && new Date(b) <= new Date(a)) e.ends = 'Debe terminar después de empezar.'
  return e
}

export type EventStatus = 'vigente' | 'proximo' | 'terminado'

export function eventStatus(ev: Pick<CampusEvent, 'starts_at' | 'ends_at'>, nowMs: number): EventStatus {
  if (nowMs < new Date(ev.starts_at).getTime()) return 'proximo'
  if (nowMs >= new Date(ev.ends_at).getTime()) return 'terminado'
  return 'vigente'
}

/**
 * Eventos del campus y sus temas. Mientras un evento está vigente, activa su tipo (reglas) y su tema:
 * las canciones con ese tema solo se ofrecen en ese tiempo. `themeCounts` (tema → canciones) avisa si un tema no tiene canciones.
 */
export function useAdminEvents(enabled: boolean, themeCounts: Record<string, number>) {
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  useEditFocus(editingId)
  const [draft, setDraft] = useState<EventDraft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setEvents(await fetchEvents())
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

  const startEdit = useCallback((ev: CampusEvent) => {
    setEditingId(ev.id)
    setDraft({ name: ev.name, type: ev.type, starts: toLocalInput(ev.starts_at), ends: toLocalInput(ev.ends_at), theme: ev.theme ?? '' })
    setFormError(null)
  }, [])

  const cancel = useCallback(() => {
    setEditingId(null)
    setFormError(null)
  }, [])

  const setField = useCallback(<K extends EventField>(field: K, value: EventDraft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }, [])

  const errors = editingId ? validateEvent(draft) : {}
  const themeKey = draft.theme.trim()
  const themeNote = !themeKey
    ? null
    : themeCounts[themeKey]
      ? `${themeCounts[themeKey]} ${themeCounts[themeKey] === 1 ? 'canción usa' : 'canciones usan'} este tema.`
      : 'Ninguna canción tiene este tema todavía: agrégalo a las canciones para que suene.'

  const save = useCallback(async () => {
    if (!editingId || Object.keys(validateEvent(draft)).length > 0) return
    setSaving(true)
    setFormError(null)
    const input = {
      name: draft.name.trim(),
      type: draft.type,
      starts_at: fromLocalInput(draft.starts)!,
      ends_at: fromLocalInput(draft.ends)!,
      theme: draft.theme.trim() || null,
    }
    try {
      if (editingId === 'new') await insertEvent(input)
      else await updateEvent(editingId, input)
      setEditingId(null)
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }, [editingId, draft, load])

  const askDelete = useCallback((id: string | null) => setDeleteId(id), [])

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteEvent(deleteId)
      setDeleteId(null)
      await load()
    } catch (e) {
      setDeleteId(null)
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [deleteId, load])

  return {
    events,
    loading,
    error,
    editingId,
    draft,
    errors,
    themeNote,
    saving,
    formError,
    deleteId,
    startNew,
    startEdit,
    cancel,
    setField,
    save,
    askDelete,
    confirmDelete,
  }
}

export type AdminEventsModel = ReturnType<typeof useAdminEvents>
