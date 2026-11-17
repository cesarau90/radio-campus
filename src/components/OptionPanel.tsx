import type { RoundOption, Song } from '../types'
import Cover from './Cover'
import { CheckMark } from './icons'

export type PanelState = 'idle' | 'selected' | 'dimmed' | 'chosen'

interface Props {
  option: RoundOption
  song: Song
  state: PanelState
  /** Solo en la ronda abierta sin voto: la tarjeta es una opción de radio (teclado y lector de pantalla incluidos). */
  interactive: boolean
  /** true solo cuando el voto acaba de enviarse: el sello se anima. Al recargar aparece ya puesto. */
  stampAnimated: boolean
  onSelect: (option: RoundOption) => void
}

/**
 * Una de las dos canciones en juego. Pantallas normales: tarjeta con portada protagonista y etiqueta A/B chica.
 * Pantallas bajas o muy angostas: fila compacta (miniatura, título y artista, círculo de selección a la derecha).
 * Es el mismo marcado; el CSS decide la forma.
 */
export default function OptionPanel({ option, song, state, interactive, stampAnimated, onSelect }: Props) {
  const letter = option.toUpperCase()
  const className = `vt-card is-${state}`
  const checked = state === 'selected' || state === 'chosen'

  const body = (
    <>
      <span className="vt-card-cover">
        <Cover song={song} />
        <span className="vt-tag mono" aria-hidden="true">
          {letter}
        </span>
        {state === 'chosen' && (
          <span className={`vt-stamp${stampAnimated ? ' is-new' : ''}`}>
            <CheckMark size={16} />
            Voto registrado
          </span>
        )}
      </span>
      <span className="vt-card-body">
        <span className="sr-only">Opción {letter}: </span>
        <span className="vt-title">{song.title}</span>
        <span className="vt-artist">{song.artist}</span>
        <span className="vt-genre mono">{song.genre}</span>
      </span>
      <span className="vt-check" aria-hidden="true">
        {checked && <CheckMark size={16} />}
      </span>
    </>
  )

  if (!interactive) {
    return <div className={className}>{body}</div>
  }

  return (
    <label className={className}>
      <input
        type="radio"
        name="round-option"
        className="sr-only"
        checked={state === 'selected'}
        onChange={() => onSelect(option)}
      />
      {body}
    </label>
  )
}
