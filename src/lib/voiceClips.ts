import { guessLang, mergeSegments, type Segment } from './speech'

/** Carpeta pública con los clips pregrabados (ElevenLabs): frase_*.mp3 y <youtube_id>.mp3. Orden en docs/voz/orden.json. */
export const VOICE_DIR = '/audio/voz'

type SongLike = { youtube_id: string; title: string; artist: string; genre?: string }

/** Un pedazo de lo que dice la radio: su clip y, si el clip falta o falla, el texto que dice la voz del navegador. */
export interface Piece {
  url: string
  fallback: Segment[]
}

const phrase = (file: string, text: string): Piece => ({
  url: `${VOICE_DIR}/frase_${file}.mp3`,
  fallback: [{ text, lang: 'es' }],
})

/** "Título, de Artista." con el idioma de la canción (igual que la voz del navegador). */
const song = (s: SongLike): Piece => {
  const lang = guessLang(s)
  return {
    url: `${VOICE_DIR}/${s.youtube_id}.mp3`,
    fallback: mergeSegments([
      { text: s.title, lang },
      { text: ', de ', lang: 'es' },
      { text: s.artist, lang },
      { text: '.', lang: 'es' },
    ]),
  }
}

/** Nueva ronda: votar → Opción A → canción A → Opción B → canción B. */
export function newRoundPieces(a: SongLike, b: SongLike): Piece[] {
  return [
    phrase('votar', 'Ya puedes votar desde tu celular.'),
    phrase('opcion_a', 'Opción A.'),
    song(a),
    phrase('opcion_b', 'Opción B.'),
    song(b),
  ]
}

/** Resultado: ronda cerrada → (empate) → sigue → canción ganadora. */
export function roundResultPieces(winner: SongLike, tie: boolean): Piece[] {
  return [
    phrase('ronda_cerrada', 'Ronda cerrada.'),
    ...(tie ? [phrase('empate', 'Hubo empate.')] : []),
    phrase('sigue', 'Sigue.'),
    song(winner),
  ]
}
