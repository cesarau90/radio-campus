import './admin.css'
import type { AdminSongsModel, SongFilter } from '../hooks/useAdminSongs'
import { CheckField, SelectField, TextField } from './AdminField'
import Cover from './Cover'

const FILTERS: Array<{ value: SongFilter; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'activas', label: 'Activas' },
  { value: 'inactivas', label: 'Inactivas' },
  { value: 'restringidas', label: 'Restringidas' },
]

const ENERGY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}${n === 1 ? ' · tranquila' : n === 5 ? ' · muy movida' : ''}` }))

function fmt(sec: number): string {
  return sec > 0 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '—'
}

/** Catálogo de canciones. Solo pinta el modelo de useAdminSongs. */
export default function SongsPanel({ songs: s }: { songs: AdminSongsModel }) {
  const isNew = s.editingId === 'new'
  const invalid = Object.keys(s.errors).length > 0
  return (
    <section className="ad-section ad-section--wide" aria-labelledby="songs-h">
      <div className="ad-head">
        <h2 className="ad-h2" id="songs-h">
          Canciones <span className="ad-count mono">{s.total}</span>
        </h2>
        <button type="button" className="ad-btn ad-btn--primary" onClick={s.startNew} disabled={s.editingId !== null}>
          Agregar canción
        </button>
      </div>

      {s.editingId !== null && (
        <form
          className="ad-group"
          onSubmit={(e) => {
            e.preventDefault()
            void s.save()
          }}
        >
          <h3 className="ad-legend">{isNew ? 'Nueva canción' : 'Editar canción'}</h3>
          {isNew ? (
            <div className="ad-lookup">
              <TextField
                label="Enlace o ID de YouTube"
                value={s.draft.youtube}
                onChange={(v) => s.setField('youtube', v)}
                error={s.errors.youtube}
                hint="Ejemplo: https://www.youtube.com/watch?v=JGwWNGJdvx8"
                mono
              />
              <button type="button" className="ad-btn" onClick={() => void s.check()} disabled={s.lookup.status === 'checking'}>
                {s.lookup.status === 'checking' ? 'Comprobando…' : 'Comprobar en YouTube'}
              </button>
            </div>
          ) : (
            <p className="ad-hint mono">YouTube: {s.draft.youtube}</p>
          )}
          {s.lookup.message && (
            <p className={s.lookup.status === 'error' ? 'ad-error' : 'ad-ok'} role="status">
              {s.lookup.message}
            </p>
          )}
          <div className="ad-grid">
            <TextField label="Título" value={s.draft.title} onChange={(v) => s.setField('title', v)} error={s.errors.title} required />
            <TextField label="Artista" value={s.draft.artist} onChange={(v) => s.setField('artist', v)} />
            <TextField label="Género" value={s.draft.genre} onChange={(v) => s.setField('genre', v)} error={s.errors.genre} list="dl-genres" required />
            <TextField label="Ánimo" value={s.draft.mood} onChange={(v) => s.setField('mood', v)} error={s.errors.mood} list="dl-moods" required />
            <SelectField label="Energía" value={s.draft.energy} options={ENERGY_OPTIONS} onChange={(v) => s.setField('energy', v)} />
            <TextField label="Duración (segundos)" value={s.draft.duration} onChange={(v) => s.setField('duration', v)} error={s.errors.duration} mono />
            <TextField
              label="Tema (opcional)"
              value={s.draft.theme}
              onChange={(v) => s.setField('theme', v)}
              list="dl-themes"
              hint="Si lo tiene, solo suena cuando ese tema está activo (evento o regla)."
            />
          </div>
          <datalist id="dl-genres">{s.suggestions.genres.map((g) => <option key={g} value={g} />)}</datalist>
          <datalist id="dl-moods">{s.suggestions.moods.map((g) => <option key={g} value={g} />)}</datalist>
          <datalist id="dl-themes">{s.suggestions.themes.map((g) => <option key={g} value={g} />)}</datalist>
          <CheckField label="Activa" hint="Si está apagada, no entra a ninguna ronda." checked={s.draft.active} onChange={(v) => s.setField('active', v)} />
          <CheckField
            label="Restringida"
            hint="Nunca entra a una ronda (p. ej. no apta para el campus). Solo la ve el admin."
            checked={s.draft.restricted}
            onChange={(v) => s.setField('restricted', v)}
          />
          {s.draft.restricted && (
            <TextField label="Motivo de la restricción" value={s.draft.restriction_note} onChange={(v) => s.setField('restriction_note', v)} />
          )}
          {s.formError && (
            <p className="ad-error" role="alert">
              {s.formError}
            </p>
          )}
          <div className="ad-actions">
            <button type="submit" className="ad-btn ad-btn--primary" disabled={invalid || s.saving}>
              {s.saving ? 'Guardando…' : isNew ? 'Agregar al catálogo' : 'Guardar cambios'}
            </button>
            <button type="button" className="ad-btn" onClick={s.cancel} disabled={s.saving}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="ad-toolbar">
        <div className="ad-field ad-field--grow">
          <label className="ad-label" htmlFor="songs-q">
            Buscar
          </label>
          <input
            id="songs-q"
            type="search"
            className="ad-input"
            placeholder="Título, artista, género, ánimo o tema"
            value={s.search}
            onChange={(e) => s.setSearch(e.target.value)}
          />
        </div>
        <SelectField label="Mostrar" value={s.filter} options={FILTERS} onChange={s.setFilter} />
      </div>

      {s.error && (
        <p className="ad-error" role="alert">
          {s.error}
        </p>
      )}
      {s.loading ? (
        <p className="ad-hint">Cargando canciones…</p>
      ) : s.songs.length === 0 ? (
        <p className="ad-hint">No hay canciones con ese filtro.</p>
      ) : (
        <div className="ad-tablewrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th scope="col">Canción</th>
                <th scope="col">Género · ánimo</th>
                <th scope="col">Energía</th>
                <th scope="col">Duración</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {s.songs.map((song) => (
                <tr key={song.id} className={song.active && !song.restricted ? '' : 'is-off'}>
                  <td>
                    <span className="ad-song">
                      <span className="ad-song-cover">
                        <Cover song={song} />
                      </span>
                      <span className="ad-song-text">
                        <strong>{song.title}</strong>
                        <span className="ad-hint">{song.artist || 'Sin artista'}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    {song.genre} · {song.mood}
                    {song.theme && <span className="ad-chip">{song.theme}</span>}
                  </td>
                  <td className="mono">{song.energy}</td>
                  <td className="mono">{fmt(song.duration_sec)}</td>
                  <td>
                    {song.restricted ? (
                      <span className="ad-chip ad-chip--warn" title={song.restriction_note ?? undefined}>
                        Restringida
                      </span>
                    ) : song.active ? (
                      <span className="ad-chip ad-chip--ok">Activa</span>
                    ) : (
                      <span className="ad-chip">Inactiva</span>
                    )}
                  </td>
                  <td>
                    {s.deleteId === song.id ? (
                      <span className="ad-row-actions" role="group" aria-label={`Borrar ${song.title}`}>
                        <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" onClick={() => void s.confirmDelete()}>
                          Sí, borrar
                        </button>
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => s.askDelete(null)}>
                          No
                        </button>
                      </span>
                    ) : (
                      <span className="ad-row-actions">
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => s.startEdit(song)} disabled={s.editingId !== null}>
                          Editar
                        </button>
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => void s.toggleActive(song)}>
                          {song.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => s.askDelete(song.id)}>
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
