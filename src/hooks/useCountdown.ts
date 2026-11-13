import { useEffect, useState } from 'react'

/**
 * Cuenta regresiva hacia `endsAt` usando la hora del servidor (`nowMs` de useServerClock).
 * `remainingMs` es null mientras no haya fecha o el reloj no esté listo.
 * `expired` pasa a true cuando llega a 0; quien lo use decide qué hacer (p. ej. close_round).
 *
 * El valor se calcula al renderizar; el intervalo solo fuerza un nuevo render cada 250 ms.
 */
export function useCountdown(endsAt: string | null, nowMs: () => number, enabled: boolean) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!endsAt || !enabled) return
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [endsAt, enabled])

  const remainingMs = endsAt && enabled ? Math.max(0, new Date(endsAt).getTime() - nowMs()) : null

  return {
    remainingMs,
    remainingSec: remainingMs === null ? null : Math.ceil(remainingMs / 1000),
    expired: remainingMs === 0,
  }
}
