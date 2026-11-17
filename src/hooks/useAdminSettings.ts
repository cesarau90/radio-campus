import { useCallback, useEffect, useState } from 'react'
import { fetchSettings, updateSettings } from '../lib/api'
import type { NoVotesRule, Settings, TieRule } from '../types'

/** Los campos del formulario. Los números van como texto mientras se escribe y se validan al guardar. */
export interface SettingsDraft {
  round_duration_sec: string
  max_play_sec: string
  no_repeat_minutes: string
  tie_rule: TieRule
  no_votes_rule: NoVotesRule
  paused: boolean
  lat: string
  lon: string
}

export type SettingsField = keyof SettingsDraft

function toDraft(s: Settings): SettingsDraft {
  return {
    round_duration_sec: String(s.round_duration_sec),
    max_play_sec: String(s.max_play_sec),
    no_repeat_minutes: String(s.no_repeat_minutes),
    tie_rule: s.tie_rule,
    no_votes_rule: s.no_votes_rule,
    paused: s.paused,
    lat: String(s.lat),
    lon: String(s.lon),
  }
}

const isInt = (v: string) => /^\d+$/.test(v.trim())
const isNum = (v: string) => v.trim() !== '' && Number.isFinite(Number(v))

/** Las mismas reglas que los `check` de la tabla settings, para avisar antes de enviar. */
export function validateSettings(d: SettingsDraft): Partial<Record<SettingsField, string>> {
  const e: Partial<Record<SettingsField, string>> = {}
  if (!isInt(d.round_duration_sec) || Number(d.round_duration_sec) < 10) e.round_duration_sec = 'Un número entero, de 10 en adelante.'
  if (!isInt(d.max_play_sec)) e.max_play_sec = 'Un número entero; 0 = canción completa.'
  if (!isInt(d.no_repeat_minutes)) e.no_repeat_minutes = 'Un número entero, de 0 en adelante.'
  if (!isNum(d.lat) || Math.abs(Number(d.lat)) > 90) e.lat = 'Entre -90 y 90.'
  if (!isNum(d.lon) || Math.abs(Number(d.lon)) > 180) e.lon = 'Entre -180 y 180.'
  return e
}

/** Ajustes de la radio (settings): carga, formulario con validación, guardar y descartar cambios. `enabled` espera a que haya sesión de admin. */
export function useAdminSettings(enabled: boolean) {
  const [saved, setSaved] = useState<Settings | null>(null)
  const [draft, setDraft] = useState<SettingsDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchSettings().then(
      (s) => {
        if (cancelled) return
        setSaved(s)
        setDraft(toDraft(s))
      },
      (e: Error) => {
        if (!cancelled) setError(e.message)
      },
    )
    return () => {
      cancelled = true
    }
  }, [enabled])

  const setField = useCallback(<K extends SettingsField>(field: K, value: SettingsDraft[K]) => {
    setJustSaved(false)
    setDraft((d) => (d ? { ...d, [field]: value } : d))
  }, [])

  const errors = draft ? validateSettings(draft) : {}
  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(toDraft(saved))

  const save = useCallback(async () => {
    if (!draft || Object.keys(validateSettings(draft)).length > 0) return
    setSaving(true)
    setError(null)
    try {
      const next = await updateSettings({
        round_duration_sec: Number(draft.round_duration_sec),
        max_play_sec: Number(draft.max_play_sec),
        no_repeat_minutes: Number(draft.no_repeat_minutes),
        tie_rule: draft.tie_rule,
        no_votes_rule: draft.no_votes_rule,
        paused: draft.paused,
        lat: Number(draft.lat),
        lon: Number(draft.lon),
      })
      setSaved(next)
      setDraft(toDraft(next))
      setJustSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }, [draft])

  const reset = useCallback(() => {
    if (saved) setDraft(toDraft(saved))
    setError(null)
    setJustSaved(false)
  }, [saved])

  return { draft, errors, dirty, saving, error, justSaved, setField, save, reset }
}

export type AdminSettingsModel = ReturnType<typeof useAdminSettings>
