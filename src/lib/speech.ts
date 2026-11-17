/**
 * Piezas puras de la voz de la radio (sin navegador): qué idioma tiene una canción, cómo se parte un anuncio
 * en frases por idioma y cómo se elige la mejor voz de cada idioma. useSpeech las usa; no depende de speechSynthesis.
 */

export type Lang = 'es' | 'en'

/** Un tramo de texto que se dice con la voz de su idioma. */
export interface Segment {
  text: string
  lang: Lang
}

const norm = (lang: string) => lang.replace('_', '-').toLowerCase()
const isNatural = (v: SpeechSynthesisVoice) => /natural/i.test(v.name)

// ---------- idioma de una canción ----------

/** Géneros que se dicen en español (latino, regional, reggaetón, banda, cumbia…). */
const SPANISH_GENRE = /latin|regional|reggaet|banda|cumbia|norte[ñn]|mariachi|bolero|ranchera|salsa|bachata|corrido|mexican/i
const SPANISH_CHARS = /[áéíóúñüÁÉÍÓÚÑÜ¿¡]/

/**
 * Heurística simple: género latino/regional → español; título o artista con acentos o ñ → español;
 * en cualquier otro caso → inglés. No es perfecta (p. ej. "Despacito" no tiene acentos y está en pop).
 */
export function guessLang(song: { title: string; artist: string; genre?: string }): Lang {
  if (song.genre && SPANISH_GENRE.test(song.genre)) return 'es'
  if (SPANISH_CHARS.test(`${song.title} ${song.artist}`)) return 'es'
  return 'en'
}

// ---------- frases por idioma ----------

/** Une los tramos vecinos del mismo idioma y quita los vacíos, para decir lo mínimo de frases posible. */
export function mergeSegments(segments: Segment[]): Segment[] {
  const out: Segment[] = []
  for (const s of segments) {
    if (!s.text.trim()) continue
    const last = out[out.length - 1]
    if (last && last.lang === s.lang) last.text += s.text
    else out.push({ text: s.text, lang: s.lang })
  }
  return out.map((s) => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() }))
}

type SongLike = { title: string; artist: string; genre?: string }

/** "Ahora suena <título> de <artista>": lo fijo en español; título y artista con el idioma de la canción. */
export function nowPlayingSegments(intro: string, song: SongLike): Segment[] {
  const lang = guessLang(song)
  return mergeSegments([
    { text: `${intro} `, lang: 'es' },
    { text: song.title, lang },
    { text: ' de ', lang: 'es' },
    { text: song.artist, lang },
  ])
}

/** Aviso de nueva ronda: "Ya puedes votar… Opción A: <título>. Opción B: <título>." */
export function newRoundSegments(a: SongLike, b: SongLike): Segment[] {
  return mergeSegments([
    { text: 'Ya puedes votar desde tu celular. Opción A: ', lang: 'es' },
    { text: a.title, lang: guessLang(a) },
    { text: '. Opción B: ', lang: 'es' },
    { text: b.title, lang: guessLang(b) },
    { text: '.', lang: 'es' },
  ])
}

/** Aviso de resultado: "Ronda cerrada. [Hubo empate.] Sigue <título>, de <artista>." */
export function roundResultSegments(winner: SongLike, tie: boolean): Segment[] {
  const lang = guessLang(winner)
  return mergeSegments([
    { text: `Ronda cerrada. ${tie ? 'Hubo empate. ' : ''}Sigue `, lang: 'es' },
    { text: winner.title, lang },
    { text: ', de ', lang: 'es' },
    { text: winner.artist, lang },
    { text: '.', lang: 'es' },
  ])
}

// ---------- elección de voz ----------

/** Español: "Jorge" Natural → es-MX Natural → es-MX → es-US → cualquier español. */
export function pickSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const mx = voices.filter((v) => norm(v.lang) === 'es-mx')
  return (
    voices.find((v) => /jorge/i.test(v.name) && isNatural(v)) ??
    mx.find(isNatural) ??
    mx[0] ??
    voices.find((v) => norm(v.lang) === 'es-us') ??
    voices.find((v) => norm(v.lang).startsWith('es'))
  )
}

/** Inglés masculino: Andrew → Guy → Brian (en-US, mejor si es Natural) → en-US Natural → en-US → cualquier inglés. */
export function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const us = voices.filter((v) => norm(v.lang) === 'en-us')
  for (const name of [/andrew/i, /guy/i, /brian/i]) {
    const found = us.find((v) => name.test(v.name) && isNatural(v)) ?? us.find((v) => name.test(v.name))
    if (found) return found
  }
  return us.find(isNatural) ?? us[0] ?? voices.find((v) => norm(v.lang).startsWith('en'))
}

export function pickVoiceFor(lang: Lang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return lang === 'es' ? pickSpanishVoice(voices) : pickEnglishVoice(voices)
}

/** ¿La voz elegida ya es una "Natural"? Si no, vale la pena esperar a que el navegador cargue las de Edge. */
export function isNaturalVoice(v: SpeechSynthesisVoice | undefined): boolean {
  return !!v && isNatural(v)
}
