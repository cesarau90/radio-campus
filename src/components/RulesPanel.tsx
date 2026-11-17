import './admin.css'
import { describeEffect, describeWhen, type AdminRulesModel } from '../hooks/useAdminRules'
import { EVENT_TYPES } from '../hooks/useAdminEvents'
import { CheckField, SelectField, TextField } from './AdminField'

const EVENT_OPTIONS = [{ value: '' as const, label: 'Cualquiera (no condiciona)' }, ...EVENT_TYPES]

interface Props {
  rules: AdminRulesModel
  /** Sugerencias tomadas del catálogo de canciones. */
  genres: string[]
  moods: string[]
  themes: string[]
}

/** Reglas contextuales. Solo pinta el modelo de useAdminRules. */
export default function RulesPanel({ rules: r, genres, moods, themes }: Props) {
  const isNew = r.editingId === 'new'
  const invalid = Object.keys(r.errors).length > 0
  return (
    <section className="ad-section ad-section--wide" aria-labelledby="rules-h">
      <div className="ad-head">
        <h2 className="ad-h2" id="rules-h">
          Reglas contextuales
        </h2>
        <button type="button" className="ad-btn ad-btn--primary" onClick={r.startNew} disabled={r.editingId !== null}>
          Agregar regla
        </button>
      </div>
      <p className="ad-hint">
        La radio aplica las reglas activas que cumplen sus condiciones (hora, temperatura, evento). <strong>Mayor prioridad gana:</strong> la regla
        de número más alto decide los géneros y la energía (por ejemplo, Exámenes con prioridad 100 gana sobre el horario y la temperatura, que
        valen 20 y 30); las demás solo afinan el ánimo y el tema. Después de cambiar una regla, compruébalo en <em>Simular contexto</em>.
      </p>

      {r.editingId !== null && (
        <form
          className="ad-group"
          onSubmit={(e) => {
            e.preventDefault()
            void r.save()
          }}
        >
          <h3 className="ad-legend">{isNew ? 'Nueva regla' : 'Editar regla'}</h3>
          <div className="ad-grid">
            <TextField label="Nombre" value={r.draft.name} onChange={(v) => r.setField('name', v)} error={r.errors.name} required />
            <TextField
              label="Prioridad"
              value={r.draft.priority}
              onChange={(v) => r.setField('priority', v)}
              error={r.errors.priority}
              hint="Número entero: mayor gana."
              mono
            />
          </div>
          <CheckField label="Activa" hint="Apagada, la regla no se aplica (pero se conserva)." checked={r.draft.active} onChange={(v) => r.setField('active', v)} />

          <h4 className="ad-subtitle">Cuándo aplica (vacío = no condiciona)</h4>
          <div className="ad-grid">
            <TextField label="Desde la hora (0–23)" value={r.draft.hourFrom} onChange={(v) => r.setField('hourFrom', v)} error={r.errors.hourFrom} mono />
            <TextField
              label="Hasta la hora (0–23)"
              value={r.draft.hourTo}
              onChange={(v) => r.setField('hourTo', v)}
              error={r.errors.hourTo}
              hint="De 16 a 6 cruza la medianoche."
              mono
            />
            <TextField label="Temperatura mínima (°C)" value={r.draft.tempMin} onChange={(v) => r.setField('tempMin', v)} error={r.errors.tempMin} mono />
            <TextField label="Temperatura máxima (°C)" value={r.draft.tempMax} onChange={(v) => r.setField('tempMax', v)} error={r.errors.tempMax} mono />
            <SelectField label="Evento vigente" value={r.draft.eventType} options={EVENT_OPTIONS} onChange={(v) => r.setField('eventType', v)} />
          </div>

          <h4 className="ad-subtitle">Qué hace (vacío = no restringe)</h4>
          <div className="ad-grid">
            <TextField
              label="Géneros permitidos"
              value={r.draft.genres}
              onChange={(v) => r.setField('genres', v)}
              list="dl-rule-genres"
              hint="Separados por coma. Ejemplo: instrumental, pop."
            />
            <TextField label="Energía mínima (1–5)" value={r.draft.energyMin} onChange={(v) => r.setField('energyMin', v)} error={r.errors.energyMin} mono />
            <TextField label="Energía máxima (1–5)" value={r.draft.energyMax} onChange={(v) => r.setField('energyMax', v)} error={r.errors.energyMax} mono />
            <TextField label="Ánimos" value={r.draft.moods} onChange={(v) => r.setField('moods', v)} list="dl-rule-moods" hint="Separados por coma. Afinan, no vacían." />
            <TextField label="Temas" value={r.draft.themes} onChange={(v) => r.setField('themes', v)} list="dl-rule-themes" hint="Separados por coma. Ejemplo: navidad." />
          </div>
          <datalist id="dl-rule-genres">{genres.map((g) => <option key={g} value={g} />)}</datalist>
          <datalist id="dl-rule-moods">{moods.map((g) => <option key={g} value={g} />)}</datalist>
          <datalist id="dl-rule-themes">{themes.map((g) => <option key={g} value={g} />)}</datalist>

          {r.formError && (
            <p className="ad-error" role="alert">
              {r.formError}
            </p>
          )}
          <div className="ad-actions">
            <button type="submit" className="ad-btn ad-btn--primary" disabled={invalid || r.saving}>
              {r.saving ? 'Guardando…' : isNew ? 'Agregar regla' : 'Guardar cambios'}
            </button>
            <button type="button" className="ad-btn" onClick={r.cancel} disabled={r.saving}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {r.error && (
        <p className="ad-error" role="alert">
          {r.error}
        </p>
      )}
      {r.loading ? (
        <p className="ad-hint">Cargando reglas…</p>
      ) : r.rules.length === 0 ? (
        <p className="ad-hint">Todavía no hay reglas: la radio elegirá sin restricciones.</p>
      ) : (
        <div className="ad-tablewrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th scope="col">Prioridad</th>
                <th scope="col">Regla</th>
                <th scope="col">Cuándo</th>
                <th scope="col">Qué hace</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {r.rules.map((rule) => (
                <tr key={rule.id} className={rule.active ? '' : 'is-off'}>
                  <td className="mono ad-priority">{rule.priority}</td>
                  <td>
                    <strong>{rule.name}</strong>
                  </td>
                  <td className="ad-cell-text">{describeWhen(rule)}</td>
                  <td className="ad-cell-text">{describeEffect(rule)}</td>
                  <td>
                    <span className={`ad-chip${rule.active ? ' ad-chip--ok' : ''}`}>{rule.active ? 'Activa' : 'Apagada'}</span>
                  </td>
                  <td>
                    {r.deleteId === rule.id ? (
                      <span className="ad-row-actions" role="group" aria-label={`Borrar ${rule.name}`}>
                        <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" onClick={() => void r.confirmDelete()}>
                          Sí, borrar
                        </button>
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => r.askDelete(null)}>
                          No
                        </button>
                      </span>
                    ) : (
                      <span className="ad-row-actions">
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => r.startEdit(rule)} disabled={r.editingId !== null}>
                          Editar
                        </button>
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => void r.toggleActive(rule)}>
                          {rule.active ? 'Apagar' : 'Activar'}
                        </button>
                        <button type="button" className="ad-btn ad-btn--sm ad-btn--warn" onClick={() => r.askDelete(rule.id)}>
                          Borrar
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
