import type { ConnectionStatus } from '../types'

interface Props {
  status: ConnectionStatus
}

/** Aviso fijo cuando se pierde la conexión en vivo. Con conexión normal no ocupa espacio. */
export default function ConnectionBanner({ status }: Props) {
  if (status === 'connected') return null
  const offline = status === 'error'
  return (
    <div className={`vt-banner${offline ? ' is-error' : ''}`} role="status">
      {offline ? 'Sin conexión. No podrás votar hasta que vuelva.' : 'Reconectando…'}
    </div>
  )
}
