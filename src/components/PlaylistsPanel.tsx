import './admin.css'
import { isUsable, type AdminPlaylistsModel } from '../hooks/useAdminPlaylists'
import Cover from './Cover'

/** Playlists. Solo pinta el modelo de useAdminPlaylists. */
export default function PlaylistsPanel({ playlists: p }: { playlists: AdminPlaylistsModel }) {
  const cur = p.current
  return (
    <section className="ad-section ad-section--wide" aria-labelledby="pl-h">
      <h2 className="ad-h2" id="pl-h">
        Playlists
      </h2>
      <p className="ad-hint">
        La playlist de <strong>respaldo</strong> es la que usa la radio cuando no hay dato de clima o quedan menos de 2 canciones elegibles: nunca abre una ronda vacía.
        Aquí puedes ver las playlists, agregar o quitar canciones y elegir cuál es la de respaldo.
      </p>

      {p.error && (
        <p className="ad-error" role="alert">
          {p.error}
        </p>
      )}
      {p.notice && (
        <p className="ad-ok" role="status">
          {p.notice}
        </p>
      )}

      {p.loading ? (
        <p className="ad-hint">Cargando playlists…</p>
      ) : p.playlists.length === 0 ? (
        <p className="ad-hint">No hay playlists. Corre el seed de la base de datos para crear la de respaldo.</p>
      ) : (
        <>
          <div className="ad-presets" role="group" aria-label="Playlists">
            {p.playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                className={`ad-btn ad-btn--sm ad-preset${cur?.id === pl.id ? ' is-current' : ''}`}
                aria-pressed={cur?.id === pl.id}
                onClick={() => p.select(pl.id)}
              >
                <strong>
                  {pl.name} {pl.is_fallback && <span className="ad-chip ad-chip--ok">Respaldo</span>}
                </strong>
                <span className="ad-hint">{p.counts[pl.id] ?? 0} canciones</span>
              </button>
            ))}
          </div>

          {cur && (
            <div className="ad-group">
              <div className="ad-head">
                <h3 className="ad-legend">{cur.name}</h3>
                {cur.is_fallback ? (
                  <span className="ad-chip ad-chip--ok">Es la playlist de respaldo</span>
                ) : p.confirmFallbackId === cur.id ? (
                  <span className="ad-row-actions" role="group" aria-label="Confirmar playlist de respaldo">
                    <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={() => void p.confirmFallback()} disabled={p.busy}>
                      Sí, usar como respaldo
                    </button>
                    <button type="button" className="ad-btn ad-btn--sm" onClick={() => p.askFallback(null)}>
                      No
                    </button>
                  </span>
                ) : (
                  <button type="button" className="ad-btn ad-btn--sm" onClick={() => p.askFallback(cur.id)} disabled={p.busy}>
                    Usar como respaldo
                  </button>
                )}
              </div>
              {p.confirmFallbackId === cur.id && (
                <p className="ad-hint">La playlist de respaldo actual dejará de serlo: solo puede haber una.</p>
              )}
              {p.fallbackWarning && (
                <p className="ad-error" role="alert">
                  {p.fallbackWarning}
                </p>
              )}

              <div className="ad-field">
                <label className="ad-label" htmlFor="pl-q">
                  Agregar una canción
                </label>
                <input
                  id="pl-q"
                  type="search"
                  className="ad-input"
                  placeholder="Busca por título, artista, género o ánimo"
                  value={p.search}
                  onChange={(e) => p.setSearch(e.target.value)}
                />
              </div>
              {p.search.trim() !== '' && (
                <ul className="ad-results" aria-label="Resultados de la búsqueda">
                  {p.results.length === 0 ? (
                    <li className="ad-hint">Sin resultados (o ya está en la playlist).</li>
                  ) : (
                    p.results.map((s) => (
                      <li key={s.id} className="ad-result">
                        <span className="ad-song-cover">
                          <Cover song={s} />
                        </span>
                        <span className="ad-song-text">
                          <strong>{s.title}</strong>
                          <span className="ad-hint">
                            {s.artist} · {s.genre}
                          </span>
                        </span>
                        <button type="button" className="ad-btn ad-btn--sm" onClick={() => void p.add(s)} disabled={p.busy}>
                          Agregar
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}

              <h4 className="ad-subtitle">
                Canciones <span className="ad-count mono">{p.rows.length}</span>
              </h4>
              {p.rows.length === 0 ? (
                <p className="ad-hint">Esta playlist está vacía.</p>
              ) : (
                <div className="ad-tablewrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th scope="col">Canción</th>
                        <th scope="col">Género · ánimo</th>
                        <th scope="col">Estado</th>
                        <th scope="col">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.rows.map(({ link, song }) => (
                        <tr key={link.song_id} className={song && isUsable(song) ? '' : 'is-off'}>
                          <td>
                            {song ? (
                              <span className="ad-song">
                                <span className="ad-song-cover">
                                  <Cover song={song} />
                                </span>
                                <span className="ad-song-text">
                                  <strong>{song.title}</strong>
                                  <span className="ad-hint">{song.artist}</span>
                                </span>
                              </span>
                            ) : (
                              <span className="ad-hint">Canción no disponible</span>
                            )}
                          </td>
                          <td>{song ? `${song.genre} · ${song.mood}` : '—'}</td>
                          <td>
                            {song && isUsable(song) ? (
                              <span className="ad-chip ad-chip--ok">Utilizable</span>
                            ) : (
                              <span className="ad-chip" title="Una canción inactiva o restringida no puede salir en rondas">
                                {song?.restricted ? 'Restringida' : 'Inactiva'}
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="ad-btn ad-btn--sm ad-btn--warn"
                              onClick={() => void p.remove(song, link.song_id)}
                              disabled={p.busy}
                              aria-label={`Quitar ${song?.title ?? 'canción'} de la playlist`}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
