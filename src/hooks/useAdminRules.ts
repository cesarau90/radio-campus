import { useCallback, useEffect, useState } from 'react'
import { deleteRule, fetchRules, insertRule, updateRule } from '../lib/api'
import type { ContextRule, ContextRuleInput, EventType } from '../types'
import { useEditFocus } from './useEditFocus'

export interface RuleDraft {
  name: string
  priority: string
  active: boolean
  hourFrom: string
  hourTo: string
  tempMin: string
  tempMax: string
  eventType: '' | EventType
  genres: string
  energyMin: string
  energyMax: string
  moods: string
  themes: string
}

export type RuleField = keyof RuleDraft

const EMPTY: RuleDraft = {
  name: '',
  priority: '50',
  active: true,
  hourFrom: '',
  hourTo: '',
  tempMin: '',
  tempMax: '',
  eventType: '',
  genres: '',
  energyMin: '',
  energyMax: '',
  moods: '',
  themes: '',
}

/** "pop, rock" → ['pop', 'rock']; vacío → null (no restringe). */
function toList(text: string): string[] | null {
  const items = text.split(',').map((x) => x.trim()).filter(Boolean)
  return items.length > 0 ? items : null
}

const num = (v: string): number | null => (v.trim() === '' ? null : Number(v))

function toDraft(r: ContextRule): RuleDraft {
  const s = (v: number | null) => (v === null ? '' : String(v))
  return {
    name: r.name,
    priority: String(r.priority),
    active: r.active,
    hourFrom: s(r.hour_from),
    hourTo: s(r.hour_to),
    tempMin: s(r.temp_min),
    tempMax: s(r.temp_max),
    eventType: r.event_type ?? '',
    genres: (r.allowed_genres ?? []).join(', '),
    energyMin: s(r.energy_min),
    energyMax: s(r.energy_max),
    moods: (r.moods ?? []).join(', '),
    themes: (r.themes ?? []).join(', '),
  }
}

function toInput(d: RuleDraft): ContextRuleInput {
  return {
    name: d.name.trim(),
    priority: Number(d.priority),
    active: d.active,
    hour_from: num(d.hourFrom),
    hour_to: num(d.hourTo),
    temp_min: num(d.tempMin),
    temp_max: num(d.tempMax),
    event_type: d.eventType === '' ? null : d.eventType,
    allowed_genres: toList(d.genres),
    energy_min: num(d.energyMin),
    energy_max: num(d.energyMax),
    moods: toList(d.moods),
    themes: toList(d.themes),
  }
}

const isInt = (v: string) => /^-?\d+$/.test(v.trim())
const isHour = (v: string) => /^\d{1,2}$/.test(v.trim()) && Number(v) <= 23
const isEnergy = (v: string) => /^[1-5]$/.test(v.trim())
const isNum = (v: string) => v.trim() !== '' && Number.isFinite(Number(v))

/** Las mismas condiciones que los `check` de la tabla context_rules, para avisar antes de enviar. */
export function validateRule(d: RuleDraft): Partial<Record<RuleField, string>> {
  const e: Partial<Record<RuleField, string>> = {}
  if (!d.name.trim()) e.name = 'Falta el nombre.'
  if (!isInt(d.priority)) e.priority = 'Un número entero (mayor = gana).'
  const hf = d.hourFrom.trim()
  const ht = d.hourTo.trim()
  if (hf && !isHour(hf)) e.hourFrom = 'Una hora de 0 a 23.'
  if (ht && !isHour(ht)) e.hourTo = 'Una hora de 0 a 23.'
  if (!e.hourFrom && !e.hourTo && !!hf !== !!ht) e.hourTo = 'Pon las dos horas o ninguna.'
  if (d.tempMin.trim() && !isNum(d.tempMin)) e.tempMin = 'Grados (número).'
  if (d.tempMax.trim() && !isNum(d.tempMax)) e.tempMax = 'Grados (número).'
  if (!e.tempMin && !e.tempMax && d.tempMin.trim() && d.tempMax.trim() && Number(d.tempMin) > Number(d.tempMax)) {
    e.tempMax = 'El máximo no puede ser menor que el mínimo.'
  }
  if (d.energyMin.trim() && !isEnergy(d.energyMin)) e.energyMin = 'De 1 a 5.'
  if (d.energyMax.trim() && !isEnergy(d.energyMax)) e.energyMax = 'De 1 a 5.'
  if (!e.energyMin && !e.energyMax && d.energyMin.trim() && d.energyMax.trim() && Number(d.energyMin) > Number(d.energyMax)) {
    e.energyMax = 'La energía máxima no puede ser menor que la mínima.'
  }
  return e
}

/** Resumen de cuándo aplica la regla, en una línea. */
export function describeWhen(r: ContextRule): string {
  const parts: string[] = []
  if (r.hour_from !== null && r.hour_to !== null) parts.push(`de ${r.hour_from}:00 a ${r.hour_to}:00`)
  if (r.temp_min !== null) parts.push(`desde ${r.temp_min} °C`)
  if (r.temp_max !== null) parts.push(`hasta ${r.temp_max} °C`)
  if (r.event_type) parts.push(`evento: ${r.event_type}`)
  return parts.length ? parts.join(' · ') : 'Siempre'
}

/** Resumen de lo que hace la regla, en una línea. */
export function describeEffect(r: ContextRule): string {
  const parts: string[] = []
  if (r.allowed_genres?.length) parts.push(`géneros: ${r.allowed_genres.join(', ')}`)
  if (r.energy_min !== null || r.energy_max !== null) parts.push(`energía ${r.energy_min ?? 1}–${r.energy_max ?? 5}`)
  if (r.moods?.length) parts.push(`ánimos: ${r.moods.join(', ')}`)
  if (r.themes?.length) parts.push(`temas: ${r.themes.join(', ')}`)
  return parts.length ? parts.join(' · ') : 'Sin efecto'
}

/**
 * Reglas contextuales (Fase 10). El algoritmo (SQL) aplica las reglas activas que cumplen sus condiciones, por prioridad:
 * la de MAYOR prioridad define géneros y energía; las demás solo afinan ánimo y tema. Aquí se crean, editan, apagan y borran.
 */
export function useAdminRules(enabled: boolean) {
  const [rules, setRules] = useState<ContextRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  useEditFocus(editingId)
  const [draft, setDraft] = useState<RuleDraft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRules(await fetchRules())
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

  const startEdit = useCallback((r: ContextRule) => {
    setEditingId(r.id)
    setDraft(toDraft(r))
    setFormError(null)
  }, [])

  const cancel = useCallback(() => {
    setEditingId(null)
    setFormError(null)
  }, [])

  const setField = useCallback(<K extends RuleField>(field: K, value: RuleDraft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }, [])

  const errors = editingId ? validateRule(draft) : {}

  const save = useCallback(async () => {
    if (!editingId || Object.keys(validateRule(draft)).length > 0) return
    setSaving(true)
    setFormError(null)
    try {
      if (editingId === 'new') await insertRule(toInput(draft))
      else await updateRule(editingId, toInput(draft))
      setEditingId(null)
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }, [editingId, draft, load])

  const toggleActive = useCallback(
    async (r: ContextRule) => {
      try {
        await updateRule(r.id, { active: !r.active })
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [load],
  )

  const askDelete = useCallback((id: string | null) => setDeleteId(id), [])

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteRule(deleteId)
      setDeleteId(null)
      await load()
    } catch (e) {
      setDeleteId(null)
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [deleteId, load])

  return {
    rules,
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
    toggleActive,
    askDelete,
    confirmDelete,
    reload: load,
  }
}

export type AdminRulesModel = ReturnType<typeof useAdminRules>
