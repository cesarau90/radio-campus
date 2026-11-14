import type { RoundOption, Song } from '../types'
import { CheckMark } from './icons'

export type PanelState = 'idle' | 'selected' | 'dimmed' | 'chosen'

interface Props {
  option: RoundOption
  song: Song
  state: PanelState
  /** Solo en la ronda abierta sin voto: el panel es una opción de radio (teclado y lector de pantalla incluidos). */
  interactive: boolean
  /** true solo cuando el voto acaba de enviarse: el sello se anima. Al recargar aparece ya puesto. */
  stampAnimated: boolean
  onSelect: (option: RoundOption) => void
}

/** Una de las dos estaciones del dial: bloque de tinta (A) o naranja señal (B). */
export default function OptionPanel({ option, song, state, interactive, stampAnimated, onSelect }: Props) {
  const letter = option.toUpperCase()
  const tone = option === 'a' ? 'ink' : 'signal'
  const className = `vt-panel vt-panel--${tone} is-${state}`

  const body = (
    <>
      <span className="vt-letter" aria-hidden="true">
        {letter}
      </span>
      <span className="vt-panel-body">
        <span className="sr-only">Opción {letter}: </span>
        <span className="vt-title">{song.title}</span>
        <span className="vt-artist">{song.artist}</span>
        <span className="vt-genre">{song.genre}</span>
      </span>

      {state === 'selected' && (
        <span className="vt-picked">
          <CheckMark size={16} />
          Tu elección
        </span>
      )}
      {state === 'chosen' && (
        <span className={`vt-stamp${stampAnimated ? ' is-new' : ''}`}>
          <CheckMark size={16} />
          Voto registrado
        </span>
      )}
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
