import './admin.css'
import { useId } from 'react'
import type { AdminSettingsModel, SettingsField } from '../hooks/useAdminSettings'
import type { NoVotesRule, TieRule } from '../types'

const TIE_OPTIONS: Array<{ value: TieRule; label: string }> = [
  { value: 'aleatorio', label: 'Al azar' },
  { value: 'menos_reproducida', label: 'La menos reproducida' },
  { value: 'opcion_a', label: 'La opción A' },
]
const NO_VOTES_OPTIONS: Array<{ value: NoVotesRule; label: string }> = [
  { value: 'aleatorio', label: 'Una de las dos al azar' },
  { value: 'respaldo', label: 'Una de la playlist de respaldo' },
]

function NumberField({
  s,
  field,
  label,
  hint,
}: {
  s: AdminSettingsModel
  field: Extract<SettingsField, 'round_duration_sec' | 'max_play_sec' | 'no_repeat_minutes' | 'lat' | 'lon'>
  label: string
  hint: string
}) {
  const id = useId()
  const error = s.errors[field]
  return (
    <div className="ad-field">
      <label className="ad-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="ad-input mono"
        inputMode="decimal"
        value={s.draft?.[field] ?? ''}
        onChange={(e) => s.setField(field, e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint`}
      />
      <span id={`${id}-hint`} className={error ? 'ad-error' : 'ad-hint'}>
        {error ?? hint}
      </span>
    </div>
  )
}

/** Ajustes de la radio. Solo pinta el modelo de useAdminSettings. */
export default function SettingsForm({ settings: s }: { settings: AdminSettingsModel }) {
  const tieId = useId()
  const noVotesId = useId()
  const pausedId = useId()
  if (!s.draft) {
    return <p className="ad-hint">{s.error ? `No se pudieron cargar los ajustes: ${s.error}` : 'Cargando ajustes…'}</p>
  }
  const invalid = Object.keys(s.errors).length > 0
  return (
    <form
      className="ad-section ad-section--form"
      onSubmit={(e) => {
        e.preventDefault()
        void s.save()
      }}
    >
      <h2 className="ad-h2">Configuración de la radio</h2>

      <div className="ad-form-grid">
      <fieldset className="ad-group">
        <legend className="ad-legend">Rondas y reproducción</legend>
        <NumberField s={s} field="round_duration_sec" label="Duración mínima de la ronda (segundos)" hint="La ronda dura lo que suena la canción menos 10 s, y nunca menos que esto." />
        <NumberField s={s} field="max_play_sec" label="Máximo por canción (segundos)" hint="0 = la canción completa. Con un valor, se corta con fade-out. Para la demo: 90." />
        <NumberField s={s} field="no_repeat_minutes" label="No repetir canciones durante (minutos)" hint="Una canción que sonó no vuelve a salir en este tiempo." />
      </fieldset>

      <fieldset className="ad-group">
        <legend className="ad-legend">Reglas de resultado</legend>
        <div className="ad-field">
          <label className="ad-label" htmlFor={tieId}>
            Si hay empate, gana
          </label>
          <select id={tieId} className="ad-input" value={s.draft.tie_rule} onChange={(e) => s.setField('tie_rule', e.target.value as TieRule)}>
            {TIE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ad-field">
          <label className="ad-label" htmlFor={noVotesId}>
            Si nadie vota, suena
          </label>
          <select id={noVotesId} className="ad-input" value={s.draft.no_votes_rule} onChange={(e) => s.setField('no_votes_rule', e.target.value as NoVotesRule)}>
            {NO_VOTES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="ad-group">
        <legend className="ad-legend">Ubicación del clima</legend>
        <NumberField s={s} field="lat" label="Latitud" hint="Tampico: 22.2331." />
        <NumberField s={s} field="lon" label="Longitud" hint="Tampico: -97.8611." />
      </fieldset>

      <fieldset className="ad-group">
        <legend className="ad-legend">Estado</legend>
        <label className="ad-check" htmlFor={pausedId}>
          <input id={pausedId} type="checkbox" checked={s.draft.paused} onChange={(e) => s.setField('paused', e.target.checked)} />
          <span>
            <strong>Pausar la radio</strong>
            <span className="ad-hint"> La pantalla deja de avanzar y la música se detiene hasta que lo quites.</span>
          </span>
        </label>
      </fieldset>
      </div>

      {s.error && (
        <p className="ad-error" role="alert">
          {s.error}
        </p>
      )}
      <div className="ad-actions">
        <button type="submit" className="ad-btn ad-btn--primary" disabled={!s.dirty || invalid || s.saving}>
          {s.saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="ad-btn" disabled={!s.dirty || s.saving} onClick={s.reset}>
          Descartar
        </button>
        {s.justSaved && (
          <span className="ad-ok" role="status">
            Guardado. /pantalla lo toma en la siguiente ronda.
          </span>
        )}
      </div>
    </form>
  )
}
