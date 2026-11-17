import './radio.css'

/** Pastilla "EN VIVO". El punto pulsa; con movimiento reducido queda fijo (el texto ya lo dice). */
export default function LiveBadge() {
  return (
    <span className="live-badge">
      <span className="live-dot" aria-hidden="true" />
      EN VIVO
    </span>
  )
}
