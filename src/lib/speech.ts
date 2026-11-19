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

/** Géneros que se dicen en español (latino y pop latino, urbano, reggaetón, salsa, bachata, cumbia, banda, regional, norteño, mariachi…). */
const SPANISH_GENRE =
  /latin|urbano|reggaet|salsa|bachata|cumbia|banda|regional|norte[ñn]o|mariachi|ranchera|corrido|bolero|trova|mexican/i
const SPANISH_CHARS = /[áéíóúñüÁÉÍÓÚÑÜ¿¡]/

/**
 * Palabras comunes en español (sin acentos y en minúsculas). Se buscan como palabra completa en el título y el artista.
 * Se evitaron las que también son palabras comunes en inglés ("no", "me", "sin", "solo"…) para no leer en español un título en inglés.
 */
const SPANISH_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'mi', 'tu', 'te', 'que', 'por', 'para', 'con',
  'amor', 'corazon', 'cielito', 'lindo', 'noche', 'vida', 'volver', 'bailando', 'feliz', 'navidad', 'beso', 'besos',
  'quiero', 'siempre', 'nunca', 'cuando', 'donde', 'mundo', 'cielo', 'fiesta', 'vamos', 'baila',
])

/** Quita acentos y pasa a minúsculas, y separa en palabras. */
function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
}

/** ¿El texto trae alguna palabra común en español o un diminutivo (-ito/-ita, como "Despacito")? */
function hasSpanishWord(text: string): boolean {
  return words(text).some((w) => SPANISH_WORDS.has(w) || (w.length >= 7 && /(ito|ita)$/.test(w)))
}

/**
 * Heurística simple, en este orden: género latino o regional → español; **título** con acentos o ñ → español
 * (el acento solo en el nombre del artista no cuenta: Michael Bublé, Frédéric Chopin);
 * título o artista con una palabra común en español (de, la, amor, corazón, volver…) o un diminutivo → español;
 * en cualquier otro caso → inglés. No es perfecta: es una regla, no un detector de idioma.
 */
export function guessLang(song: { title: string; artist: string; genre?: string }): Lang {
  if (song.genre && SPANISH_GENRE.test(song.genre)) return 'es'
  if (SPANISH_CHARS.test(song.title)) return 'es'
  if (hasSpanishWord(`${song.title} ${song.artist}`)) return 'es'
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

/** Nombres de voces masculinas conocidas (Edge y Windows): sirven para quedarse con las de mujer cuando no hay una preferida. */
const MALE_NAME =
  /\b(jorge|alvaro|alonso|raul|pablo|diego|manuel|ricardo|carlos|andrew|brian|guy|christopher|eric|roger|steffan|ryan|davis|tony|jason|david|mark|james|george|daniel|jacob|aaron)/i
const isFemale = (v: SpeechSynthesisVoice) => !MALE_NAME.test(v.name)
/** La voz de mujer si hay alguna; si no, la primera. */
const preferFemale = (list: SpeechSynthesisVoice[]) => list.find(isFemale) ?? list[0]

/** Español: "Jorge" Natural (es-MX) → respaldo "Dalia" Natural → es-MX Natural de mujer → es-MX → es-US → cualquier español. */
export function pickSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const mx = voices.filter((v) => norm(v.lang) === 'es-mx')
  return (
    mx.find((v) => /jorge/i.test(v.name) && isNatural(v)) ??
    mx.find((v) => /dalia/i.test(v.name) && isNatural(v)) ??
    mx.find((v) => isNatural(v) && isFemale(v)) ??
    preferFemale(mx) ??
    preferFemale(voices.filter((v) => norm(v.lang) === 'es-us')) ??
    preferFemale(voices.filter((v) => norm(v.lang).startsWith('es')))
  )
}

/** Inglés (voz de mujer): Jenny → Aria → Ava (en-US, Natural) → en-US Natural de mujer → en-US → cualquier inglés. */
export function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const us = voices.filter((v) => norm(v.lang) === 'en-us')
  for (const name of [/jenny/i, /aria/i, /\bava/i]) {
    const found = us.find((v) => name.test(v.name) && isNatural(v))
    if (found) return found
  }
  return (
    us.find((v) => isNatural(v) && isFemale(v)) ??
    preferFemale(us) ??
    preferFemale(voices.filter((v) => norm(v.lang).startsWith('en')))
  )
}

export function pickVoiceFor(lang: Lang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return lang === 'es' ? pickSpanishVoice(voices) : pickEnglishVoice(voices)
}

/** ¿La voz elegida ya es una "Natural"? Si no, vale la pena esperar a que el navegador cargue las de Edge. */
export function isNaturalVoice(v: SpeechSynthesisVoice | undefined): boolean {
  return !!v && isNatural(v)
}
