import { useEffect, useState } from 'react'
import { clockLabel } from '../lib/weather'

/** Hora "14:32" del campus según el reloj del servidor; se refresca cada 10 s. null hasta que el reloj esté listo. */
export function useClockLabel(nowMs: () => number, ready: boolean) {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => {
    if (!ready) return
    const update = () => setLabel(clockLabel(nowMs()))
    const first = setTimeout(update, 0)
    const id = setInterval(update, 10_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [nowMs, ready])
  return label
}
