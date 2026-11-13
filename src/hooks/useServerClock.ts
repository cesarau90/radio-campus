import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchServerNow } from '../lib/api'

const SAMPLES = 3
const RESYNC_MS = 60_000

/**
 * Reloj del servidor. Los celulares tienen la hora desfasada, así que toda cuenta regresiva
 * se calcula contra now() del servidor: offset = hora_servidor − punto medio del viaje.
 * Toma 3 muestras y se queda con la de menor latencia (la más precisa). Se resincroniza cada
 * minuto, al volver a la pestaña y al recuperar la conexión.
 * `enabled` debe esperar a que haya sesión (server_now es solo para usuarios autenticados).
 */
export function useServerClock(enabled: boolean) {
  const offsetRef = useRef(0)
  const [state, setState] = useState({ ready: false, offsetMs: 0, rttMs: 0 })

  const resync = useCallback(async () => {
    let best: { offset: number; rtt: number } | null = null
    for (let i = 0; i < SAMPLES; i++) {
      const t0 = Date.now()
      try {
        const iso = await fetchServerNow()
        const t1 = Date.now()
        const rtt = t1 - t0
        const offset = new Date(iso).getTime() - (t0 + t1) / 2
        if (!best || rtt < best.rtt) best = { offset, rtt }
      } catch {
        // una muestra fallida no invalida las demás
      }
    }
    if (best) {
      offsetRef.current = best.offset
      setState({ ready: true, offsetMs: Math.round(best.offset), rttMs: best.rtt })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    // Primera sincronización: el setState ocurre después de los await.
    // oxlint-disable-next-line react/set-state-in-effect
    void resync()
    const interval = setInterval(() => void resync(), RESYNC_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void resync()
    }
    const onOnline = () => void resync()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [enabled, resync])

  /** Hora actual del servidor en milisegundos (estable entre renders). */
  const nowMs = useCallback(() => Date.now() + offsetRef.current, [])

  return { ...state, nowMs, resync }
}
