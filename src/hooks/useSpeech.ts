import { useCallback, useEffect, useRef, useState } from 'react'
import { isNaturalVoice, mergeSegments, pickVoiceFor, type Lang, type Segment } from '../lib/speech'

const MS_PER_CHAR = 70 // lectura pausada, para estimar cuánto dura un texto
const GRACE_MS = 5000
const VOICES_WAIT_MS = 2000 // tope para esperar a que el navegador cargue sus voces
const NATURAL_WAIT_MS = 2500 // solo la primera vez: tope para esperar a que Edge cargue las voces "Natural"
const NATURAL_POLL_MS = 200

/** Cuánto tarda en leerse un texto (margen incluido); sirve de tope si la voz no avisa que terminó. */
export function readingMs(text: string): number {
  return text.length * MS_PER_CHAR + GRACE_MS
}

/** Las voces se cargan en segundo plano: si todavía no hay, se espera el evento voiceschanged (con tope). */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis
  const now = synth.getVoices()
  if (now.length > 0) return Promise.resolve(now)
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener('voiceschanged', done)
      clearTimeout(timer)
      resolve(synth.getVoices())
    }
    const timer = setTimeout(done, VOICES_WAIT_MS)
    synth.addEventListener('voiceschanged', done)
  })
}

// Las voces elegidas viven a nivel de módulo: todo lo que habla (pantalla y admin) comparte la misma elección.
const chosen: Partial<Record<Lang, SpeechSynthesisVoice>> = {}
let lastLogged = ''
let waitedForNatural = false

/** Elige de nuevo la voz de cada idioma con las voces actuales y lo cuenta en consola (solo si algo cambió). */
function chooseAll(voices: SpeechSynthesisVoice[]) {
  chosen.es = pickVoiceFor('es', voices)
  chosen.en = pickVoiceFor('en', voices)
  const fmt = (v?: SpeechSynthesisVoice) => (v ? `${v.name} (${v.lang})` : 'ninguna')
  const line = `es: ${fmt(chosen.es)} | en: ${fmt(chosen.en)}`
  if (line !== lastLogged) {
    lastLogged = line
    const list = (p: string) => voices.filter((v) => v.lang.toLowerCase().startsWith(p)).map((v) => `${v.name} (${v.lang})`)
    console.info(`[voz] voces es-*: ${list('es').join(' | ') || 'ninguna'}`)
    console.info(`[voz] voces en-*: ${list('en').join(' | ') || 'ninguna'}`)
    console.info(`[voz] elegidas → ${line}`)
  }
}

/**
 * Edge carga sus voces "Online (Natural)" tarde. En la PRIMERA frase de la sesión, si todavía no hay una Natural en español,
 * se espera un poco a que lleguen (con tope) para no arrancar con la voz por defecto, que puede ser de mujer.
 */
async function ensureVoices(): Promise<void> {
  let voices = await loadVoices()
  chooseAll(voices)
  if (!isNaturalVoice(chosen.es) && !waitedForNatural) {
    waitedForNatural = true
    const until = Date.now() + NATURAL_WAIT_MS
    while (Date.now() < until && !isNaturalVoice(chosen.es)) {
      await new Promise((r) => setTimeout(r, NATURAL_POLL_MS))
      voices = window.speechSynthesis.getVoices()
      chooseAll(voices)
    }
  }
}

/**
 * Voz de la radio con speechSynthesis (gratis, sin servidor). ÚNICO lugar donde se crean `SpeechSynthesisUtterance`:
 * /pantalla y el "Probar voz" del admin pasan por `speak`, así que siempre se elige la voz igual.
 * `speak` acepta un texto en español o una lista de tramos con idioma ({ text, lang }): cada tramo se dice con la voz
 * de su idioma (Jorge para español; Andrew, Guy o Brian para inglés) y todos se encolan sin encimarse.
 * Devuelve una promesa que se cumple cuando termina el último tramo (o falla, o se agota el tope): nadie se queda colgado.
 * `speaking` sirve para bajar el volumen de la música. Chrome exige una interacción previa con la página: si bloquea la voz,
 * `blocked` pasa a true y `unlock` (desde un clic) la activa. Sin soporte de voz, solo se espera lo que tardaría en leerse.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [voiceName, setVoiceName] = useState<string | null>(null)
  const pending = useRef(0)

  // Cada vez que el navegador cambia su lista de voces (Edge carga las Natural después), se elige de nuevo.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    const refresh = () => {
      chooseAll(synth.getVoices())
      setVoiceName(chosen.es ? chosen.es.name : null)
    }
    synth.addEventListener('voiceschanged', refresh)
    const first = setTimeout(refresh, 0)
    return () => {
      synth.removeEventListener('voiceschanged', refresh)
      clearTimeout(first)
    }
  }, [])

  const speak = useCallback((input: string | Segment[]): Promise<void> => {
    const segments = mergeSegments(typeof input === 'string' ? [{ text: input, lang: 'es' }] : input)
    return new Promise<void>((resolve) => {
      pending.current += 1
      setSpeaking(true)
      let done = false
      // Tope: lo que tardaría en leerse todo, contando lo que ya está en cola (más la espera de las voces).
      const total = segments.reduce((n, s) => n + readingMs(s.text), 0)
      const cap = setTimeout(() => finish(), total * Math.max(1, pending.current) + VOICES_WAIT_MS + NATURAL_WAIT_MS)
      function finish() {
        if (done) return
        done = true
        clearTimeout(cap)
        pending.current -= 1
        if (pending.current <= 0) setSpeaking(false)
        resolve()
      }
      if (!('speechSynthesis' in window) || segments.length === 0) {
        if (segments.length === 0) finish()
        return
      }
      void ensureVoices().then(() => {
        if (done) return
        let left = segments.length
        const oneDone = () => {
          left -= 1
          if (left <= 0) finish()
        }
        for (const seg of segments) {
          const voice = chosen[seg.lang]
          const utterance = new SpeechSynthesisUtterance(seg.text)
          utterance.rate = 0.95
          utterance.pitch = 1.0
          if (voice) {
            utterance.voice = voice
            utterance.lang = voice.lang // si solo se pone lang, el navegador puede escoger otra voz
          } else {
            utterance.lang = seg.lang === 'es' ? 'es-MX' : 'en-US'
          }
          utterance.onend = oneDone
          utterance.onerror = (e) => {
            if (e.error === 'not-allowed') setBlocked(true)
            oneDone()
          }
          window.speechSynthesis.speak(utterance)
        }
      })
    })
  }, [])

  const unlock = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    setBlocked(false)
    // El clic habilita la voz para el resto de la sesión. Silencioso y con la misma voz elegida (nunca la voz por defecto).
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    if (chosen.es) {
      u.voice = chosen.es
      u.lang = chosen.es.lang
    }
    window.speechSynthesis.speak(u)
  }, [])

  return { speak, speaking, blocked, unlock, voiceName }
}
