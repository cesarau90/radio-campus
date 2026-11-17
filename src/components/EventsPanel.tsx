import './admin.css'
import { EVENT_TYPES, eventStatus, type AdminEventsModel } from '../hooks/useAdminEvents'
import { formatDateTime } from '../lib/datetime'
import { SelectField, TextField } from './AdminField'

const TYPE_LABEL = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label]))

interface Props {
  events: AdminEventsModel
  /** Temas que ya usan las canciones (para sugerirlos). */
  themes: string[]
  /** Hora actual en ms, para marcar vigente / próximo / terminado. */
  nowMs: number
}

/** Calendario de eventos y temas. Solo pinta el modelo de useAdminEvents. */
export default function EventsPanel({ events: ev, themes, nowMs }: Props) {
  const isNew = ev.editingId === 'new'
  const invalid = Object.keys(ev.errors).length > 0
  return (
    <section className="ad-section ad-section--wide" aria-labelledby="events-h">
      <div className="ad-head">
        <h2 className="ad-h2" id="events-h">
          Eventos y temas
        </h2>
        <button type="button" className="ad-btn ad-btn--primary" onClick={ev.startNew} disabled={ev.editingId !== null}>
          Agregar evento
        </button>
      </div>
      <p className="ad-hint">
        Mientras un evento está vigente, la radio aplica su tipo en las reglas y deja salir las canciones con su tema (por ejemplo,
        villancicos en diciembre). Las horas son del campus (Ciudad de México).
      </p>

      {ev.editingId !== null && (
        <form
          className="ad-group"
          onSubmit={(e) => {
            e.preventDefault()
            void ev.save()
          }}
        >
          <h3 className="ad-legend">{isNew ? 'Nuevo evento' : 'Editar evento'}</h3>
          <div className="ad-grid">
            <TextField label="Nombre" value={ev.draft.name} onChange={(v) => ev.setField('name', v)} error={ev.errors.name} required />
            <SelectField label="Tipo" value={ev.draft.type} options={EVENT_TYPES} onChange={(v) => ev.setField('type', v)} />
            <TextField label="Empieza" type="datetime-local" value={ev.draft.starts} onChange={(v) => ev.setField('starts', v)} error={ev.errors.starts} required />
            <TextField label="Termina" type="datetime-local" value={ev.draft.ends} onChange={(v) => ev.setField('ends', v)} error={ev.errors.ends} required />
            <TextField label="Tema (opcional)" value={ev.draft.theme} onChange={(v) => ev.setField('theme', v)} list="dl-event-themes" hint={ev.themeNote ?? 'Ejemplo: navideña.'} />
          </div>
          <datalist id="dl-event-themes">{themes.map((t) => <option key={t} value={t} />)}</datalist>
          {ev.formError && (
            <p className="ad-error" role="alert">
              {ev.formError}
            </p>
          )}
          <div className="ad-actions">
            <button type="submit" className="ad-btn ad-btn--primary" disabled={invalid || ev.saving}>
              {ev.saving ? 'Guardando…' : isNew ? 'Agregar evento' : 'Guardar cambios'}
            </button>
            <button type="button" className="ad-btn" onClick={ev.cancel} disabled={ev.saving}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {ev.error && (
        <p className="ad-error" role="alert">
          {ev.error}
        </p>
      )}
      {ev.loading ? (
        <p className="ad-hint">Cargando eventos…</p>
      ) : ev.events.length === 0 ? (
        <p className="ad-hint">Todavía no hay eventos.</p>
      ) : (
        <div className="ad-tablewrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th scope="col">Evento</th>
                <th scope="col">Tipo</th>
                <th scope="col">Del</th>
                <th scope="col">Al</th>
                <th scope="col">Tema</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ev.events.map((row) => {
                const status = eventStatus(row, nowMs)
                return (
                  <tr key={row.id} className={status === 'terminado' ? 'is-off' : ''}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>{TYPE_LABEL[row.type]}</td>
                    <td className="mono">{formatDateTime(row.starts_at)}</td>
                    <td className="mono">{formatDateTime(row.ends_at)}</td>
                    <td>{row.theme ?? '—'}</td>
                    <td>
                      <span className={`ad-chip${status === 'vigente' ? ' ad-chip--ok' : ''}`}>
                        {status === 'vigente' ? 'Vigente' : status === 'proximo' ? 'Próximo' : 'Terminado'}
                      </span>
                    </td>
                    <td>
                      {ev.deleteId === row.id ? (
                        <span className="ad-row-actions" role="group" aria-label={`Borrar ${row.name}`}>
                          <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" onClick={() => void ev.confirmDelete()}>
                            Sí, borrar
                          </button>
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => ev.askDelete(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="ad-row-actions">
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => ev.startEdit(row)} disabled={ev.editingId !== null}>
                            Editar
                          </button>
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => ev.askDelete(row.id)}>
                            Borrar
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
