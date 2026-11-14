import { DialMark } from './icons'

interface Props {
  /** null = no mostrar cuenta regresiva (no hay ronda abierta). */
  secondsLeft: number | null
  /** 1 = recién abrió, 0 = terminó. */
  progress: number
}

/** Marca de la radio y, si hay ronda abierta, la cuenta regresiva del servidor con su filete de progreso. */
export default function VotarHeader({ secondsLeft, progress }: Props) {
  const urgent = secondsLeft !== null && secondsLeft <= 10 && secondsLeft > 0
  return (
    <header className="vt-top">
      <div className="vt-top-row">
        <span className="vt-brand">
          <DialMark />
          Radio Campus
        </span>
        {secondsLeft !== null && (
          <span className="vt-count mono" role="timer" aria-label={`Quedan ${secondsLeft} segundos`}>
            {secondsLeft}
            <span className="vt-count-unit">s</span>
          </span>
        )}
      </div>
      {secondsLeft !== null && (
        <div className="vt-progress" aria-hidden="true">
          <div className={`vt-progress-bar${urgent ? ' is-urgent' : ''}`} style={{ transform: `scaleX(${progress})` }} />
        </div>
      )}
    </header>
  )
}
