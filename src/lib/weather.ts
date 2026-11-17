export const TIMEZONE = 'America/Mexico_City'

export interface Weather {
  /** °C, redondeado. */
  tempC: number
  /** Código WMO del tiempo actual. */
  code: number
}

/** Clima actual de Open-Meteo (gratis, sin clave). Lanza error si la respuesta no trae lo esperado. */
export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<Weather> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(TIMEZONE)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`)
  const data = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } }
  const t = data.current?.temperature_2m
  if (typeof t !== 'number') throw new Error('Open-Meteo no devolvió la temperatura.')
  return { tempC: Math.round(t), code: data.current?.weather_code ?? -1 }
}

/** Código WMO → texto corto en español. */
export function weatherLabel(code: number): string {
  if (code === 0) return 'Despejado'
  if (code === 1) return 'Mayormente despejado'
  if (code === 2) return 'Parcialmente nublado'
  if (code === 3) return 'Nublado'
  if (code === 45 || code === 48) return 'Niebla'
  if (code >= 51 && code <= 57) return 'Llovizna'
  if (code >= 61 && code <= 67) return 'Lluvia'
  if (code >= 71 && code <= 77) return 'Nieve'
  if (code >= 80 && code <= 82) return 'Chubascos'
  if (code === 85 || code === 86) return 'Chubascos de nieve'
  if (code >= 95) return 'Tormenta'
  return ''
}

/** "14:32" en la zona horaria del campus. */
export function clockLabel(ms: number): string {
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIMEZONE }).format(ms)
}
