import type { RoundOption, RoundResolution, Song, TallyRow } from '../types'
import Cover from './Cover'
import { CheckMark } from './icons'
import NowPlaying from './NowPlaying'

interface Props {
  winner: Song | null
  winnerOption: RoundOption | null
  tally: TallyRow[]
  resolution: RoundResolution | null
  /** La opción por la que votó esta persona en la ronda, si votó. */
  myOption: RoundOption | null
  /** Lo que suena ahora, si hay dato. */
  nowPlaying: Song | null
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

/** Ronda cerrada: la ganadora con su portada, el recuento A contra B, qué pasó con tu voto y qué sigue. */
export default function ResultView({ winner, winnerOption, tally, resolution, myOption, nowPlaying }: Props) {
  const resolutionText = resolution ? RESOLUTION_TEXT[resolution] : ''
  return (
    <main className="vt-result">
      <h1 className="vt-heading">Ronda cerrada</h1>

      {nowPlaying && (
        <div className="vt-now vt-result-now">
          <NowPlaying song={nowPlaying} />
        </div>
      )}

      <div className="vt-result-grid">
        {winner && (
          <section className="vt-card is-chosen vt-winner" aria-label="Canción ganadora">
            <span className="vt-card-cover vt-winner-cover">
              <Cover song={winner} />
              {winnerOption && (
                <span className="vt-tag mono" aria-hidden="true">
                  {winnerOption.toUpperCase()}
                </span>
              )}
              <span className="vt-stamp is-new">
                <CheckMark size={16} />
                Ganadora
              </span>
            </span>
            <span className="vt-card-body">
              <span className="vt-title">{winner.title}</span>
              <span className="vt-artist">{winner.artist}</span>
              <span className="vt-genre mono">{winner.genre}</span>
            </span>
          </section>
        )}

        <div className="vt-result-side">
          <ul className="vt-tally" aria-label="Votos de la ronda">
            {tally.map((row) => (
              <li key={row.option} className={`vt-tally-row${row.isWinner ? ' is-winner' : ''}`}>
                <span className="vt-tally-head">
                  <span className="vt-tally-tag mono" aria-hidden="true">
                    {row.option.toUpperCase()}
                  </span>
                  <span className="vt-tally-title">
                    <span className="sr-only">Opción {row.option.toUpperCase()}: </span>
                    {row.title}
                  </span>
                  <span className="vt-tally-num mono">
                    {row.votes} {row.votes === 1 ? 'voto' : 'votos'} · {row.percent} %
                  </span>
                </span>
                <span className="vt-meter" aria-hidden="true">
                  <span className="vt-meter-fill" style={{ width: `${row.percent}%` }} />
                </span>
              </li>
            ))}
          </ul>

          <div className="vt-result-msg" aria-live="polite">
            <p className="vt-result-line">{myVoteLine(myOption, winnerOption)}</p>
            {resolutionText && <p className="vt-result-note">{resolutionText}</p>}
            <p className="vt-result-next">La siguiente ronda empieza pronto.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
