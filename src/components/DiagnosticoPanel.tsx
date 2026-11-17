import type { ConnectionStatus, PlaybackPhase } from '../types'

interface Props {
  session: { userId: string | null; ready: boolean; error: string | null }
  clock: { ready: boolean; offsetMs: number; rttMs: number }
  countdown: { remainingSec: number | null; expired: boolean }
  live: {
    connection: ConnectionStatus
    loading: boolean
    error: string | null
    paused: boolean | null
    lat: number | null
    lon: number | null
    phase: PlaybackPhase | null
    songsLoaded: number
    hasRound: boolean
    announcements: number
  }
}

const row = { display: 'grid', gridTemplateColumns: '14rem 1fr', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--color-line)' } as const

/** Panel de diagnóstico (solo desarrollo). Presentacional: todo llega por props. */
export default function DiagnosticoPanel({ session, clock, countdown, live }: Props) {
  const items: Array<[string, string]> = [
    ['sesión', session.error ?? (session.ready ? `lista · ${session.userId}` : 'iniciando…')],
    ['reloj del servidor', clock.ready ? `desfase ${clock.offsetMs} ms · latencia ${clock.rttMs} ms` : 'sincronizando…'],
    ['cuenta regresiva (20 s)', countdown.remainingSec === null ? '—' : countdown.expired ? 'terminó' : `${countdown.remainingSec} s`],
    ['Realtime', live.connection],
    ['carga', live.error ?? (live.loading ? 'cargando…' : 'ok')],
    ['settings', `pausado=${String(live.paused)} · lat=${live.lat} lon=${live.lon}`],
    ['reproducción', `fase=${live.phase}`],
    ['canciones en memoria', String(live.songsLoaded)],
    ['hay ronda', live.hasRound ? 'sí' : 'no'],
    ['anuncios visibles', String(live.announcements)],
  ]
  return (
    <main style={{ padding: '2rem', maxWidth: '56rem' }}>
      <p className="mono" style={{ margin: 0, color: 'var(--color-text-muted)' }}>
        solo desarrollo
      </p>
      <h1 style={{ fontSize: 'var(--step-3)', margin: '0.25rem 0 1.5rem' }}>Diagnóstico</h1>
      <dl style={{ margin: 0 }} data-testid="diagnostico">
        {items.map(([k, v]) => (
          <div key={k} style={row}>
            <dt className="mono" style={{ color: 'var(--color-text-muted)' }}>{k}</dt>
            <dd className="mono" style={{ margin: 0 }} data-key={k}>{v}</dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
