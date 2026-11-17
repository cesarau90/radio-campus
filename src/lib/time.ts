/** 562 → "09:22". Siempre dos dígitos en minutos y segundos para que el contador no baile. */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/** 562 → "9 minutos y 22 segundos" (para lectores de pantalla). */
export function spokenDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  const min = `${m} ${m === 1 ? 'minuto' : 'minutos'}`
  const sec = `${r} ${r === 1 ? 'segundo' : 'segundos'}`
  if (m === 0) return sec
  return r === 0 ? min : `${min} y ${sec}`
}
