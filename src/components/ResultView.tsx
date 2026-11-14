import type { RoundOption, RoundResolution, Song } from '../types'

interface Props {
  winner: Song | null
  winnerOption: RoundOption | null
  votesA: number
  votesB: number
  resolution: RoundResolution | null
  /** La opción por la que votó esta persona en la ronda, si votó. */
  myOption: RoundOption | null
}

const RESOLUTION_TEXT: Record<RoundResolution, string> = {
  votos: '',
  empate: 'Hubo empate y se resolvió con la regla de desempate.',
  sin_votos: 'Nadie votó, así que el sistema eligió la canción.',
}

function myVoteLine(myOption: RoundOption | null, winnerOption: RoundOption | null): string {
  if (!myOption) return 'No votaste en esta ronda.'
  if (!winnerOption) return 'Gracias por votar.'
  return myOption === winnerOption ? 'Tu voto ayudó a ganar.' : 'Esta vez ganó la otra opción.'
}

/** Resultado de la ronda cerrada: la ganadora, los conteos finales y qué pasó con el voto de esta persona. */
export default function ResultView({ winner, winnerOption, votesA, votesB, resolution, myOption }: Props) {
  const tone = winnerOption === 'b' ? 'signal' : 'ink'
  const resolutionText = resolution ? RESOLUTION_TEXT[resolution] : ''
  return (
    <main className="vt-result">
      <h1 className="vt-heading">Ronda cerrada</h1>

      {winner && (
        <section className={`vt-panel vt-panel--${tone} vt-winner`} aria-label="Canción ganadora">
          <span className="vt-letter" aria-hidden="true">
            {winnerOption ? winnerOption.toUpperCase() : ''}
          </span>
          <span className="vt-panel-body">
            <span className="vt-title">{winner.title}</span>
            <span className="vt-artist">{winner.artist}</span>
          </span>
          <span className="vt-stamp is-new">Ganó</span>
        </section>
      )}

      <dl className="vt-tally">
        <div>
          <dt>Opción A</dt>
          <dd className="mono">{votesA}</dd>
        </div>
        <div>
          <dt>Opción B</dt>
          <dd className="mono">{votesB}</dd>
        </div>
      </dl>

      <p className="vt-result-line">{myVoteLine(myOption, winnerOption)}</p>
      {resolutionText && <p className="vt-result-note">{resolutionText}</p>}
      <p className="vt-result-note" aria-live="polite">
        La siguiente votación empieza en unos momentos; esta pantalla se actualiza sola.
      </p>
    </main>
  )
}
