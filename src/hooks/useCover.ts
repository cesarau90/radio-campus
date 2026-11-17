import { useState, type SyntheticEvent } from 'react'
import { coverUrl, PLACEHOLDER_MAX_WIDTH } from '../lib/cover'

/**
 * Estado de la portada de una canción: la URL y si hay que usar el respaldo (bloque con el título).
 * Falla si la imagen no carga (onError) o si YouTube devolvió su imagen gris de 120×90.
 * Se guarda QUÉ id falló, así que al cambiar de canción se vuelve a intentar sin efectos.
 */
export function useCover(youtubeId: string) {
  const [failedId, setFailedId] = useState<string | null>(null)

  return {
    src: coverUrl(youtubeId),
    failed: failedId === youtubeId,
    onError: () => setFailedId(youtubeId),
    onLoad: (e: SyntheticEvent<HTMLImageElement>) => {
      if (e.currentTarget.naturalWidth <= PLACEHOLDER_MAX_WIDTH) setFailedId(youtubeId)
    },
  }
}
