import { DialMark } from './icons'
import LiveBadge from './LiveBadge'

interface Props {
  /** "09:22". null = no mostrar cuenta regresiva (no hay ronda abierta). */
  timeLabel: string | null
  /** "9 minutos y 22 segundos", para lectores de pantalla. */
  timeSpoken: string | null
  /** Quedan 10 s o menos. */
  urgent: boolean
  /** 1 = recién abrió, 0 = terminó. */
  progress: number
}

/** Marca de la radio con su pastilla EN VIVO y, si hay ronda abierta, la cuenta regresiva del servidor con su filete. */
export default function VotarHeader({ timeLabel, timeSpoken, urgent, progress }: Props) {
  return (
    <header className="vt-top">
      <div className="vt-top-row">
        <span className="vt-brand">
          <DialMark />
          Radio Campus
        </span>
        <LiveBadge />
      </div>
      {timeLabel !== null && (
        <>
          <div className="vt-timer-row">
            <span className="vt-timer-label">La votación cierra en</span>
            <span
              className={`vt-count mono${urgent ? ' is-urgent' : ''}`}
              role="timer"
              aria-label={`Quedan ${timeSpoken ?? timeLabel}`}
            >
              {timeLabel}
            </span>
          </div>
          <div className="vt-progress" aria-hidden="true">
            <div className="vt-progress-bar" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </>
      )}
    </header>
  )
}
