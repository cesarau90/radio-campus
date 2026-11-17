import type { Song } from '../types'
import { DialMark } from './icons'
import NowPlaying from './NowPlaying'

interface Props {
  /** Lo que suena ahora, si hay dato. */
  nowPlaying: Song | null
}

/** "Aún no hay votación": la radio sigue al aire. Un dial que respira, lo que sigue y, si hay dato, qué suena ahora. */
export default function WaitingView({ nowPlaying }: Props) {
  return (
    <main className="vt-wait" role="status" aria-live="polite">
      <span className="vt-dial" aria-hidden="true">
        <span className="vt-dial-ring" />
        <span className="vt-dial-ring is-late" />
        <DialMark size={44} />
      </span>
      <div className="vt-wait-panel">
        <h1 className="vt-heading">Aún no hay votación</h1>
        <p className="vt-wait-text">La siguiente ronda empieza pronto.</p>
        <p className="vt-wait-note">Esta pantalla se actualiza sola.</p>
      </div>
      {nowPlaying && (
        <div className="vt-now vt-wait-now">
          <NowPlaying song={nowPlaying} size="lg" />
        </div>
      )}
    </main>
  )
}
