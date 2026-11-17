import type { Settings, Song } from '../types'

/**
 * Segundos que suena una canción. Misma cuenta que start_round en SQL:
 * con tope (max_play_sec > 0): min(duración, tope), y si no se conoce la duración, el tope;
 * sin tope: la duración completa, o round_duration_sec + 10 si no se conoce.
 */
export function playSeconds(song: Pick<Song, 'duration_sec'> | null | undefined, settings: Settings): number {
  const dur = song?.duration_sec ?? 0
  if (settings.max_play_sec > 0) return Math.min(dur > 0 ? dur : settings.max_play_sec, settings.max_play_sec)
  return dur > 0 ? dur : settings.round_duration_sec + 10
}

/** Lee un token de color (--color-…) ya resuelto, para librerías que no entienden var() (p. ej. el QR en SVG). */
export function cssToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
