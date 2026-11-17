import './admin.css'
import type { AdminMonitorModel, ChartRow } from '../hooks/useAdminMonitor'
import { describeContext } from '../hooks/useAdminSimulator'
import { formatDateTime } from '../lib/datetime'
import type { PlayStatus, RoundOption, Song } from '../types'
import Cover from './Cover'

const PHASE_LABEL: Record<string, string> = {
  idle: 'En espera',
  playing: 'Sonando',
  result: 'Anunciando resultado',
  announcement: 'Dando un anuncio',
  error: 'Error de reproducción',
}
const STATUS_LABEL: Record<PlayStatus, string> = { ok: 'Normal', error: 'Falló en YouTube', skipped: 'Saltada' }
const RESOLUTION_LABEL = { votos: 'por votos', empate: 'empate', sin_votos: 'sin votos' } as const

function Bar({ tag, song, votes, percent, win }: { tag: 'A' | 'B'; song: Song | null; votes: number; percent: number; win: boolean }) {
  return (
    <li className={`ad-opt${win ? ' is-winner' : ''}`}>
      <span className="ad-chip ad-chip--ok">{tag}</span>
      <span className="ad-opt-body">
        <strong>{song?.title ?? '…'}</strong>
        <span className="ad-meter" aria-hidden="true">
          <span className="ad-meter-bar" style={{ transform: `scaleX(${percent / 100})` }} />
        </span>
      </span>
      <span className="mono ad-opt-votes">
        {votes} · {percent} %
      </span>
    </li>
  )
}

function ChartItem({ row }: { row: ChartRow }) {
  return (
    <li className="ad-chart-row">
      <span className="ad-hint mono ad-chart-time">{formatDateTime(row.startsAt)}</span>
      <span className="ad-chart-bars" role="img" aria-label={`A ${row.votesA} votos, B ${row.votesB} votos`}>
        <span className={`ad-chart-bar ad-chart-bar--a${row.winner === 'a' ? ' is-winner' : ''}`} style={{ flexGrow: Math.max(row.votesA, 0.0001) }} />
        <span className={`ad-chart-bar ad-chart-bar--b${row.winner === 'b' ? ' is-winner' : ''}`} style={{ flexGrow: Math.max(row.votesB, 0.0001) }} />
      </span>
      <span className="ad-chart-text">
        <strong>{row.winner === 'a' ? row.titleA : row.winner === 'b' ? row.titleB : (row.winner ? 'Otra canción' : 'Sin ganadora')}</strong>
        <span className="ad-hint mono">
          A {row.votesA} · B {row.votesB}
          {row.resolution && row.resolution !== 'votos' ? ` · ${RESOLUTION_LABEL[row.resolution]}` : ''}
        </span>
      </span>
    </li>
  )
}

/** Monitor y controles de la radio. Solo pinta el modelo de useAdminMonitor. */
export default function MonitorPanel({ monitor: m }: { monitor: AdminMonitorModel }) {
  const snap = m.round?.context_snapshot ?? null
  const winnerOption: RoundOption | null =
    m.round?.winner_id && m.round.winner_id === m.round.option_a ? 'a' : m.round?.winner_id && m.round.winner_id === m.round.option_b ? 'b' : null
  return (
    <section className="ad-section ad-section--wide" aria-labelledby="mon-h">
      <div className="ad-head">
        <h2 className="ad-h2" id="mon-h">
          Monitor
        </h2>
        <span className="ad-status-row">
          <span className={`ad-chip${m.connection === 'connected' ? ' ad-chip--ok' : ' ad-chip--warn'}`}>
            {m.connection === 'connected' ? 'En vivo' : m.connection === 'error' ? 'Sin conexión' : 'Reconectando…'}
          </span>
          {m.paused && <span className="ad-chip ad-chip--warn">Radio en pausa</span>}
          {m.override && <span className="ad-chip ad-chip--warn">Simulación activa</span>}
        </span>
      </div>

      {m.error && (
        <p className="ad-error" role="alert">
          {m.error}
        </p>
      )}
      {m.notice && (
        <p className="ad-ok" role="status">
          {m.notice}
        </p>
      )}

      <div className="ad-cols">
        <div className="ad-group">
          <h3 className="ad-legend">Sonando ahora</h3>
          {m.nowSong ? (
            <div className="ad-sim-song">
              <span className="ad-song-cover ad-song-cover--lg">
                <Cover song={m.nowSong} />
              </span>
              <span className="ad-song-text">
                <strong>{m.nowSong.title}</strong>
                <span className="ad-hint">{m.nowSong.artist}</span>
                <span className="ad-hint mono">
                  {PHASE_LABEL[m.phase] ?? m.phase}
                  {m.sinceLabel ? ` · lleva ${m.sinceLabel}` : ''}
                </span>
              </span>
            </div>
          ) : (
            <p className="ad-hint">Nada suena todavía. Abre /pantalla para que arranque la radio.</p>
          )}
        </div>

        <div className="ad-group">
          <h3 className="ad-legend">Controles</h3>
          <div className="ad-actions">
            <button type="button" className="ad-btn" onClick={() => void m.togglePause()} disabled={m.busy}>
              {m.paused ? 'Reanudar la radio' : 'Pausar la radio'}
            </button>
            <button type="button" className="ad-btn" onClick={() => void m.skipSong()} disabled={m.busy || !m.nowSong}>
              Saltar canción
            </button>
            {m.confirmClose ? (
              <span className="ad-row-actions" role="group" aria-label="Confirmar cierre de la ronda">
                <button type="button" className="ad-btn ad-btn--danger" onClick={() => void m.closeNow()} disabled={m.busy}>
                  Sí, cerrar ahora
                </button>
                <button type="button" className="ad-btn" onClick={() => m.askClose(false)}>
                  No
                </button>
              </span>
            ) : (
              <button type="button" className="ad-btn" onClick={() => m.askClose(true)} disabled={m.busy || !m.roundOpen}>
                Cerrar la ronda ahora
              </button>
            )}
          </div>
          <p className="ad-hint">Saltar y pausar los atiende /pantalla; hace falta que esté abierta.</p>
        </div>
      </div>

      <div className="ad-group">
        <h3 className="ad-legend">{m.roundOpen ? 'Ronda abierta' : m.round ? 'Última ronda (cerrada)' : 'Ronda'}</h3>
        {m.round ? (
          <>
            {m.roundOpen && (
              <p className="ad-count-line">
                Cierra en <strong className="mono">{m.timeLabel ?? '--:--'}</strong>
              </p>
            )}
            <ul className="ad-opts" aria-label="Votos de la ronda">
              <Bar tag="A" song={m.optionA} votes={m.round.votes_a} percent={m.percentA} win={winnerOption === 'a'} />
              <Bar tag="B" song={m.optionB} votes={m.round.votes_b} percent={m.percentB} win={winnerOption === 'b'} />
            </ul>
            {snap && (
              <p className="ad-hint">
                <strong>Contexto con el que se creó:</strong> <span className="mono">{describeContext(snap)}</span>
                {snap.overridden ? ' (simulado)' : ''} ·{' '}
                {snap.used_fallback ? `respaldo (${snap.fallback_reason === 'sin_temperatura' ? 'sin clima' : 'pocas canciones'})` : `${snap.pool_size} canciones elegibles`}
                {snap.rule_names.length ? ` · reglas: ${snap.rule_names.join(', ')}` : ''}
              </p>
            )}
          </>
        ) : (
          <p className="ad-hint">Todavía no hay rondas.</p>
        )}
      </div>

      <div className="ad-cols">
        <div className="ad-group">
          <h3 className="ad-legend">Votos de las últimas rondas</h3>
          {m.chart.length === 0 ? (
            <p className="ad-hint">Aún no hay rondas cerradas.</p>
          ) : (
            <ul className="ad-chart">
              {m.chart.map((row) => (
                <ChartItem key={row.id} row={row} />
              ))}
            </ul>
          )}
        </div>

        <div className="ad-group">
          <h3 className="ad-legend">Últimas reproducciones</h3>
          {m.history.length === 0 ? (
            <p className="ad-hint">Todavía no ha sonado nada.</p>
          ) : (
            <div className="ad-tablewrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th scope="col">Hora</th>
                    <th scope="col">Canción</th>
                    <th scope="col">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {m.history.map((h) => (
                    <tr key={h.id} className={h.status === 'ok' ? '' : 'is-off'}>
                      <td className="mono">{formatDateTime(h.played_at)}</td>
                      <td>{h.title}</td>
                      <td>
                        <span className={`ad-chip${h.status === 'error' ? ' ad-chip--warn' : ''}`} title={h.note ?? undefined}>
                          {STATUS_LABEL[h.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
