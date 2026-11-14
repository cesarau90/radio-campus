import { DialMark } from './icons'

interface Props {
  title: string
  text: string
  /** Si se pasa, se muestra un botón para reintentar. */
  actionLabel?: string
  onAction?: () => void
  /** Anima la marca (solo para "conectando"). */
  scanning?: boolean
}

/** Pantalla de estado a página completa: conectando, sin ronda, error. Dice qué pasa y qué sigue. */
export default function StatusNotice({ title, text, actionLabel, onAction, scanning = false }: Props) {
  return (
    <main className="vt-notice" role="status" aria-live="polite">
      <DialMark size={44} className={scanning ? 'vt-scan' : undefined} />
      <h1 className="vt-notice-title">{title}</h1>
      <p className="vt-notice-text">{text}</p>
      {actionLabel && onAction && (
        <button type="button" className="vt-confirm vt-confirm--inline" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </main>
  )
}
