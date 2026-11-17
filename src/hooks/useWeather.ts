import { useEffect, useState } from 'react'
import { fetchWeather, type Weather } from '../lib/weather'

const REFRESH_MS = 15 * 60_000 // el clima cambia despacio: cada 15 minutos
const RETRY_MS = 60_000

/**
 * Clima del campus (Open-Meteo, coordenadas de settings). Se actualiza solo.
 * Si falla, conserva el último dato bueno y reintenta en un minuto; sin ningún dato `weather` es null
 * y start_round usa su plan de respaldo (sin temperatura).
 */
export function useWeather(lat: number | null, lon: number | null) {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    if (lat === null || lon === null) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()

    async function load() {
      let next = REFRESH_MS
      try {
        const w = await fetchWeather(lat!, lon!, controller.signal)
        if (!cancelled) setWeather(w)
      } catch {
        next = RETRY_MS
      }
      if (!cancelled) timer = setTimeout(() => void load(), next)
    }
    void load()

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [lat, lon])

  return weather
}
