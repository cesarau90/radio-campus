import './pantalla.css'
import type { Song } from '../types'
import type { PantallaModel } from '../hooks/usePantalla'
import Cover from './Cover'
import { DialMark } from './icons'
import LiveBadge from './LiveBadge'
import QrCard from './QrCard'
import Ticker from './Ticker'

const RESOLUTION_TEXT = {
  votos: '',
  empate: 'Hubo empate y se resolvió con la regla de desempate.',
  sin_votos: 'Nadie votó, así que el sistema eligió la canción.',
} as const

function Option({ tag, song, votes, percent, isWinner }: { tag: 'A' | 'B'; song: Song; votes: number; percent: number; isWinner?: boolean }) {
  return (
    <li className={`pt-opt${isWinner ? ' is-winner' : ''}`}>
      <span className="pt-opt-cover">
        <Cover song={song} />
      </span>
      <span className="pt-opt-body">
        <span className="pt-opt-head">
          <span className="pt-tag mono" aria-hidden="true">
            {tag}
          </span>
          <span className="pt-opt-title">{song.title}</span>
        </span>
        <span className="pt-opt-artist">{song.artist}</span>
        <span className="pt-meter" aria-hidden="true">
          <span className="pt-meter-bar" style={{ transform: `scaleX(${percent / 100})` }} />
        </span>
        <span className="pt-opt-votes mono">
          {votes} {votes === 1 ? 'voto' : 'votos'} · {percent} %
        </span>
      </span>
    </li>
  )
}

/** Hueco donde YouTube monta su iframe. `attach` recibe el elemento una sola vez (es un setState estable). */
function PlayerSlot({ attach, live }: { attach: (el: HTMLElement | null) => void; live: boolean }) {
  return <span className={`pt-player${live ? ' is-live' : ''}`} ref={attach} />
}

/** Pantalla completa de /pantalla (TV del campus). Solo pinta el modelo que arma usePantalla; no tiene lógica propia. */
export default function PantallaView(m: PantallaModel) {
  const { view } = m
  const stageMessage =
    view === 'connecting'
      ? { title: 'Sintonizando…', text: 'Conectando con la radio del campus.' }
      : view === 'error'
        ? { title: 'No pudimos conectar', text: m.errorText ?? 'Revisa la conexión de esta pantalla.' }
        : null

  return (
    <div className="pt-app">
      <header className="pt-top">
        <span className="pt-brand">
          <DialMark size={48} />
          Radio Campus
        </span>
        <Ticker items={m.tickerItems} />
        <span className="pt-clock mono">{m.clockText ?? '--:--'}</span>
        <LiveBadge />
      </header>

      {stageMessage ? (
        <main className="pt-notice" role="status" aria-live="polite">
          <DialMark size={64} className={view === 'connecting' ? 'vt-scan' : undefined} />
          <h1 className="pt-notice-title">{stageMessage.title}</h1>
          <p className="pt-notice-text">{stageMessage.text}</p>
        </main>
      ) : (
        <main className="pt-stage">
          <section className="pt-now" aria-label="Sonando ahora">
            {/* El reproductor vive siempre dentro de este recuadro; con el video sonando tapa la portada. */}
            <span className="pt-now-cover">
              {m.nowSong ? (
                <Cover song={m.nowSong} />
              ) : (
                <span className="pt-dial pt-dial--fill" aria-hidden="true">
                  <DialMark size={64} className="vt-scan" />
                </span>
              )}
              <PlayerSlot attach={m.attachPlayer} live={m.playerPlaying} />
              {m.soundBlocked && (
                <button type="button" className="pt-unlock" onClick={m.unlockSound}>
                  Activar sonido
                </button>
              )}
            </span>
            {m.nowSong ? (
              <>
                <span className="pt-now-label mono">Sonando ahora</span>
                <h2 className="pt-now-title">{m.nowSong.title}</h2>
                <p className="pt-now-artist">{m.nowSong.artist}</p>
                <span className="pt-song-bar" aria-hidden="true">
                  <span className="pt-song-fill" style={{ transform: `scaleX(${m.songProgress})` }} />
                </span>
                {m.songLeftLabel && <span className="pt-song-left mono">Quedan {m.songLeftLabel}</span>}
              </>
            ) : (
              <>
                <h2 className="pt-now-title">{m.paused ? 'Radio en pausa' : 'Arrancando la radio…'}</h2>
                <p className="pt-now-artist">{m.paused ? 'Vuelve en un momento.' : 'La primera canción entra enseguida.'}</p>
              </>
            )}
          </section>

          <section className="pt-side">
            {view === 'voting' && m.songA && m.songB && (
              <>
                <h1 className="pt-heading">¿Qué suena después?</h1>
                <div className="pt-timer-row">
                  <span className="pt-timer-label">La votación cierra en</span>
                  <span className={`pt-count mono${m.urgent ? ' is-urgent' : ''}`} role="timer">
                    {m.timeLabel ?? '--:--'}
                  </span>
                </div>
                <span className="pt-progress" aria-hidden="true">
                  <span className="pt-progress-bar" style={{ transform: `scaleX(${m.roundProgress})` }} />
                </span>
                <ul className="pt-opts" aria-label="Opciones de la ronda">
                  <Option tag="A" song={m.songA} votes={m.votesA} percent={m.percentA} />
                  <Option tag="B" song={m.songB} votes={m.votesB} percent={m.percentB} />
                </ul>
              </>
            )}

            {view === 'result' && m.winner && (
              <>
                <h1 className="pt-heading">Ronda cerrada</h1>
                <p className="pt-next">
                  Sigue: <strong>{m.winner.title}</strong> · {m.winner.artist}
                </p>
                {m.songA && m.songB && (
                  <ul className="pt-opts" aria-label="Resultado de la ronda">
                    {m.tally.map((row) => (
                      <Option
                        key={row.option}
                        tag={row.option === 'a' ? 'A' : 'B'}
                        song={row.option === 'a' ? m.songA! : m.songB!}
                        votes={row.votes}
                        percent={row.percent}
                        isWinner={row.isWinner}
                      />
                    ))}
                  </ul>
                )}
                {m.resolution && RESOLUTION_TEXT[m.resolution] && <p className="pt-note">{RESOLUTION_TEXT[m.resolution]}</p>}
              </>
            )}

            {view === 'idle' && <h1 className="pt-heading">{m.paused ? 'Votación en pausa' : 'La siguiente ronda empieza pronto'}</h1>}

            <QrCard url={m.voteUrl} />
          </section>
        </main>
      )}

      {m.connection !== 'connected' && view !== 'connecting' && (
        <p className={`pt-banner${m.connection === 'error' ? ' is-error' : ''}`} role="status">
          {m.connection === 'error'
            ? 'Sin conexión. La radio sigue con lo que ya tiene y se reconecta sola.'
            : 'Reconectando…'}
        </p>
      )}
      {m.debug && (
        <div className="pt-debug">
          <button type="button" onClick={m.testVoice}>
            Probar voz
          </button>
          <button type="button" onClick={m.testEnglishSong}>
            Probar canción en inglés
          </button>
          <span className="mono">{m.voiceName ?? 'sin voz en español'}</span>
        </div>
      )}
      {m.announcement && (
        <aside className="pt-announce" role="status" aria-live="polite">
          <span className="pt-announce-label mono">Anuncio</span>
          <p className="pt-announce-text">{m.announcement}</p>
        </aside>
      )}
      {m.playerError && (
        <p className="pt-warn" role="status">
          {m.playerError}
        </p>
      )}
      {m.actionError && (
        <p className="pt-warn" role="status">
          Reintentando… {m.actionError}
        </p>
      )}
    </div>
  )
}
