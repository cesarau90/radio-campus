/**
 * Portada de una canción, derivada de su youtube_id (songs no tiene columna de imagen: decisión tomada).
 * hqdefault es 480×360 con barras negras arriba y abajo; las tarjetas la recortan con object-fit: cover.
 */
export function coverUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`
}

/** YouTube devuelve una imagen gris de 120×90 (sin error HTTP) cuando el video no existe o no tiene miniatura. */
export const PLACEHOLDER_MAX_WIDTH = 120
