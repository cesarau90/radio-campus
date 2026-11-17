import { TIMEZONE } from './weather'

const two = (n: number) => String(n).padStart(2, '0')

/** ISO → "2026-11-17T14:30" para <input type="datetime-local"> (hora local del navegador). '' si no hay fecha. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`
}

/** "2026-11-17T14:30" (hora local del navegador) → ISO UTC. null si está vacío o es inválido. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** "17 nov 2026, 14:30" en la hora del campus. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: TIMEZONE }).format(new Date(iso))
}
