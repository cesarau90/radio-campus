import './radio.css'
import type { Song } from '../types'
import Cover from './Cover'

interface Props {
  song: Song
  /** sm: franja compacta sobre la papeleta. lg: protagonista en las pantallas de espera. */
  size?: 'sm' | 'lg'
}

/** "Sonando ahora": portada chica + título y artista de lo que está al aire. */
export default function NowPlaying({ song, size = 'sm' }: Props) {
  return (
    <section className={`now-playing now-playing--${size}`} aria-label="Sonando ahora">
      <span className="now-cover">
        <Cover song={song} />
      </span>
      <span className="now-text">
        <span className="now-label mono">Sonando ahora</span>
        <span className="now-title">{song.title}</span>
        <span className="now-artist">{song.artist}</span>
      </span>
    </section>
  )
}
