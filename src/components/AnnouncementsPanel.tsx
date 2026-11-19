import './admin.css'
import { announcementStatus, MAX_TEXT, type AdminAnnouncementsModel, type AnnouncementStatus } from '../hooks/useAdminAnnouncements'
import { formatDateTime } from '../lib/datetime'
import { CheckField, TextField } from './AdminField'

const STATUS_LABEL: Record<AnnouncementStatus, string> = {
  'al-aire': 'Sale al aire',
  'sin-aprobar': 'Sin aprobar',
  apagado: 'Apagado',
  'fuera-de-fecha': 'Fuera de fechas',
}

function schedule(a: { hour_from: number | null; hour_to: number | null; starts_at: string | null; ends_at: string | null; every_n_songs: number }): string {
  const parts = [`cada ${a.every_n_songs} ${a.every_n_songs === 1 ? 'canción' : 'canciones'}`]
  if (a.hour_from !== null && a.hour_to !== null) parts.push(`de ${a.hour_from}:00 a ${a.hour_to}:00`)
  if (a.starts_at) parts.push(`desde ${formatDateTime(a.starts_at)}`)
  if (a.ends_at) parts.push(`hasta ${formatDateTime(a.ends_at)}`)
  return parts.join(' · ')
}

interface Props {
  announcements: AdminAnnouncementsModel
  nowMs: number
}

/** Anuncios de la radio. Solo pinta el modelo de useAdminAnnouncements. */
export default function AnnouncementsPanel({ announcements: an, nowMs }: Props) {
  const isNew = an.editingId === 'new'
  const invalid = Object.keys(an.errors).length > 0
  return (
    <section className="ad-section ad-section--wide" aria-labelledby="ann-h">
      <div className="ad-head">
        <h2 className="ad-h2" id="ann-h">
          Anuncios
        </h2>
        <button type="button" className="ad-btn ad-btn--primary" onClick={an.startNew} disabled={an.editingId !== null}>
          Agregar anuncio
        </button>
      </div>
      <p className="ad-hint">
        /pantalla solo lee los anuncios <strong>aprobados</strong> y <strong>activos</strong>. Se dicen entre dos canciones, nunca encima de la música.
      </p>

      {an.editingId !== null && (
        <form
          data-edit-form
          className="ad-group"
          onSubmit={(e) => {
            e.preventDefault()
            void an.save()
          }}
        >
          <h3 className="ad-legend">{isNew ? 'Nuevo anuncio' : 'Editar anuncio'}</h3>
          <TextField
            label="Texto (se lee en voz alta y se muestra en pantalla)"
            value={an.draft.text}
            onChange={(v) => an.setField('text', v)}
            error={an.errors.text}
            hint={`${an.draft.text.length} / ${MAX_TEXT} caracteres`}
            multiline
            required
          />
          <div className="ad-grid">
            <TextField label="Cada cuántas canciones" value={an.draft.every_n_songs} onChange={(v) => an.setField('every_n_songs', v)} error={an.errors.every_n_songs} mono />
            <TextField label="Desde la hora (0–23, opcional)" value={an.draft.hour_from} onChange={(v) => an.setField('hour_from', v)} error={an.errors.hour_from} mono />
            <TextField label="Hasta la hora (0–23, opcional)" value={an.draft.hour_to} onChange={(v) => an.setField('hour_to', v)} error={an.errors.hour_to} hint="Si va de 20 a 5, cruza la medianoche." mono />
            <TextField label="Empieza (opcional)" type="datetime-local" value={an.draft.starts} onChange={(v) => an.setField('starts', v)} error={an.errors.starts} />
            <TextField label="Termina (opcional)" type="datetime-local" value={an.draft.ends} onChange={(v) => an.setField('ends', v)} error={an.errors.ends} />
          </div>
          <CheckField label="Aprobado" hint="Sin aprobar no sale al aire." checked={an.draft.approved} onChange={(v) => an.setField('approved', v)} />
          <CheckField label="Activo" hint="Apágalo para pausarlo sin borrarlo." checked={an.draft.active} onChange={(v) => an.setField('active', v)} />
          {an.formError && (
            <p className="ad-error" role="alert">
              {an.formError}
            </p>
          )}
          <div className="ad-actions">
            <button type="submit" className="ad-btn ad-btn--primary" disabled={invalid || an.saving}>
              {an.saving ? 'Guardando…' : isNew ? 'Agregar anuncio' : 'Guardar cambios'}
            </button>
            <button type="button" className="ad-btn" onClick={() => an.preview(an.draft.text)} disabled={!an.draft.text.trim()}>
              Probar voz
            </button>
            <button type="button" className="ad-btn" onClick={an.cancel} disabled={an.saving}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {an.error && (
        <p className="ad-error" role="alert">
          {an.error}
        </p>
      )}
      {an.loading ? (
        <p className="ad-hint">Cargando anuncios…</p>
      ) : an.items.length === 0 ? (
        <p className="ad-hint">Todavía no hay anuncios.</p>
      ) : (
        <div className="ad-tablewrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th scope="col">Anuncio</th>
                <th scope="col">Cuándo</th>
                <th scope="col">Estado</th>
                <th scope="col">Último</th>
                <th scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {an.items.map((a) => {
                const status = announcementStatus(a, nowMs)
                return (
                  <tr key={a.id} data-row-id={a.id} className={status === 'al-aire' ? '' : 'is-off'}>
                    <td className="ad-cell-text">{a.text}</td>
                    <td className="ad-hint">{schedule(a)}</td>
                    <td>
                      <span className={`ad-chip${status === 'al-aire' ? ' ad-chip--ok' : ''}`}>{STATUS_LABEL[status]}</span>
                    </td>
                    <td className="mono ad-hint">{a.last_played_at ? formatDateTime(a.last_played_at) : 'Nunca'}</td>
                    <td>
                      {an.deleteId === a.id ? (
                        <span className="ad-row-actions" role="group" aria-label="Borrar anuncio">
                          <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" onClick={() => void an.confirmDelete()}>
                            Sí, borrar
                          </button>
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => an.askDelete(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="ad-row-actions">
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => void an.toggleApproved(a)}>
                            {a.approved ? 'Quitar aprobación' : 'Aprobar'}
                          </button>
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => void an.toggleActive(a)}>
                            {a.active ? 'Apagar' : 'Activar'}
                          </button>
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => an.preview(a.text)}>
                            Probar voz
                          </button>
                          <button type="button" className="ad-btn ad-btn--sm" onClick={() => an.startEdit(a)} disabled={an.editingId !== null}>
                            Editar
                          </button>
                          <button type="button" className="ad-btn ad-btn--sm ad-btn--warn" onClick={() => an.askDelete(a.id)}>
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
