import { useCallback, useEffect, useState } from 'react'
import { fetchSettings, previewPick, updateSettings } from '../lib/api'
import type { ContextOverride, PreviewResult } from '../types'

export type SimEvent = 'ninguno' | 'festividad' | 'examenes' | 'evento'

export interface SimDraft {
  hour: string
  temp: string
  eventType: SimEvent
  theme: string
}

export type SimField = keyof SimDraft

export const SIM_EVENTS: Array<{ value: SimEvent; label: string }> = [
  { value: 'ninguno', label: 'Sin evento' },
  { value: 'festividad', label: 'Festividad' },
  { value: 'examenes', label: 'Exámenes' },
  { value: 'evento', label: 'Evento del campus' },
]

/** Escenarios de ejemplo, uno por regla del seed, para ver cómo cambian las opciones. */
export const SIM_PRESETS: Array<{ id: string; label: string; hint: string; draft: SimDraft }> = [
  { id: 'madrugada', label: 'Madrugada tranquila', hint: '3:00 · 20 °C', draft: { hour: '3', temp: '20', eventType: 'ninguno', theme: '' } },
  { id: 'manana-fria', label: 'Mañana fresca', hint: '8:00 · 16 °C', draft: { hour: '8', temp: '16', eventType: 'ninguno', theme: '' } },
  { id: 'tarde-calor', label: 'Tarde calurosa', hint: '14:00 · 35 °C', draft: { hour: '14', temp: '35', eventType: 'ninguno', theme: '' } },
  { id: 'examenes', label: 'Semana de exámenes', hint: '10:00 · 24 °C · exámenes', draft: { hour: '10', temp: '24', eventType: 'examenes', theme: '' } },
  { id: 'navidad', label: 'Posadas y Navidad', hint: '19:00 · 22 °C · festividad "navidad"', draft: { hour: '19', temp: '22', eventType: 'festividad', theme: 'navidad' } },
  { id: 'sin-clima', label: 'Sin dato de clima', hint: '12:00 · sin temperatura (respaldo)', draft: { hour: '12', temp: '', eventType: 'ninguno', theme: '' } },
]

const EMPTY: SimDraft = { hour: '', temp: '', eventType: 'ninguno', theme: '' }

export function validateSim(d: SimDraft): Partial<Record<SimField, string>> {
  const e: Partial<Record<SimField, string>> = {}
  const h = d.hour.trim()
  if (h && (!/^\d{1,2}$/.test(h) || Number(h) > 23)) e.hour = 'Una hora de 0 a 23 (vacío = la hora real).'
  const t = d.temp.trim()
  if (t && (!Number.isFinite(Number(t)) || Number(t) < -50 || Number(t) > 60)) e.temp = 'Grados entre -50 y 60 (vacío = sin dato de clima).'
  return e
}

/** Resumen corto de un contexto: "14:00 · 35 °C · sin evento". */
export function describeContext(c: { hour: number; temp: number | null; event_type: string | null; event_theme: string | null }): string {
  const parts = [`${c.hour}:00`, c.temp === null ? 'sin clima' : `${c.temp} °C`]
  parts.push(c.event_type ? `${c.event_type}${c.event_theme ? ` "${c.event_theme}"` : ''}` : 'sin evento')
  return parts.join(' · ')
}

export interface ScenarioEntry {
  id: number
  result: PreviewResult
}

function toInput(d: SimDraft) {
  return {
    hour: d.hour.trim() === '' ? null : Number(d.hour),
    temp: d.temp.trim() === '' ? null : Number(d.temp),
    eventType: d.eventType === 'ninguno' ? null : d.eventType,
    theme: d.eventType === 'ninguno' ? null : d.theme.trim() || null,
  }
}

/** Lo que se guarda como simulación real: solo lo que se escribió; 'ninguno' apaga también el evento real del calendario. */
function toOverride(d: SimDraft): ContextOverride {
  const o: ContextOverride = { event_type: d.eventType }
  if (d.hour.trim() !== '') o.hour = Number(d.hour)
  if (d.temp.trim() !== '') o.temp = Number(d.temp)
  if (d.eventType !== 'ninguno' && d.theme.trim()) o.theme = d.theme.trim()
  return o
}

const MAX_HISTORY = 6

/**
 * Simulador de contexto (Fase 8): "¿qué opciones ofrecería la radio con esta hora, temperatura y evento?".
 * La vista previa (admin_preview_pick) solo lee: no crea rondas. Guardar la simulación (context_override)
 * sí cambia las rondas REALES que se creen a partir de ese momento; se quita con "Quitar simulación".
 */
export function useAdminSimulator(enabled: boolean) {
  const [draft, setDraft] = useState<SimDraft>(EMPTY)
  const [history, setHistory] = useState<ScenarioEntry[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [override, setOverride] = useState<ContextOverride | null>(null)
  const [applying, setApplying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [nextId, setNextId] = useState(1)

  const loadOverride = useCallback(async () => {
    try {
      setOverride((await fetchSettings()).context_override)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    // oxlint-disable-next-line react/set-state-in-effect
    void loadOverride()
  }, [enabled, loadOverride])

  const setField = useCallback(<K extends SimField>(field: K, value: SimDraft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }))
  }, [])

  const errors = validateSim(draft)

  const run = useCallback(
    async (d: SimDraft) => {
      if (Object.keys(validateSim(d)).length > 0) return
      setRunning(true)
      setError(null)
      setNotice(null)
      try {
        const result = await previewPick(toInput(d))
        setHistory((h) => [{ id: nextId, result }, ...h].slice(0, MAX_HISTORY))
        setNextId((n) => n + 1)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(
          /admin_preview_pick|schema cache|Could not find the function/i.test(msg)
            ? 'Falta aplicar la migración 20261117000100_admin_preview_pick.sql en Supabase (SQL Editor).'
            : msg,
        )
      } finally {
        setRunning(false)
      }
    },
    [nextId],
  )

  const preview = useCallback(() => run(draft), [run, draft])

  const loadPreset = useCallback(
    (id: string) => {
      const p = SIM_PRESETS.find((x) => x.id === id)
      if (!p) return
      setDraft(p.draft)
      void run(p.draft)
    },
    [run],
  )

  const applyToRadio = useCallback(async () => {
    if (Object.keys(validateSim(draft)).length > 0) return
    setApplying(true)
    setError(null)
    try {
      const next = await updateSettings({ context_override: toOverride(draft) })
      setOverride(next.context_override)
      setNotice('Simulación guardada: las rondas nuevas usan este contexto hasta que la quites.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setApplying(false)
    }
  }, [draft])

  const clearOverride = useCallback(async () => {
    setApplying(true)
    setError(null)
    try {
      const next = await updateSettings({ context_override: null })
      setOverride(next.context_override)
      setNotice('Simulación quitada: la radio vuelve a usar la hora, el clima y el calendario reales.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setApplying(false)
    }
  }, [])

  const clearHistory = useCallback(() => setHistory([]), [])

  return { draft, errors, history, running, error, notice, override, applying, setField, preview, loadPreset, applyToRadio, clearOverride, clearHistory }
}

export type AdminSimulatorModel = ReturnType<typeof useAdminSimulator>
