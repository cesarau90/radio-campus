import './radio.css'
import { useCover } from '../hooks/useCover'
import type { Song } from '../types'

interface Props {
  song: Pick<Song, 'youtube_id' | 'title'>
}

/** Portada de YouTube que llena a su contenedor. Si no carga, un bloque con el título. Decorativa: el título ya está al lado. */
export default function Cover({ song }: Props) {
  const cover = useCover(song.youtube_id)
  return (
    <span className="cover" aria-hidden="true">
      {cover.failed ? (
        <span className="cover-fallback">{song.title}</span>
      ) : (
        <img
          className="cover-img"
          src={cover.src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={cover.onError}
          onLoad={cover.onLoad}
        />
      )}
    </span>
  )
}
