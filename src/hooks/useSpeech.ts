import { useCallback, useEffect, useRef, useState } from 'react'

const MS_PER_CHAR = 70 // lectura pausada, para estimar cuánto dura un texto
const GRACE_MS = 5000
const VOICES_WAIT_MS = 2000 // tope para esperar a que el navegador cargue sus voces

/** Cuánto tarda en leerse un texto (margen incluido); sirve de tope si la voz no avisa que terminó. */
export function readingMs(text: string): number {
  return text.length * MS_PER_CHAR + GRACE_MS
}

const norm = (lang: string) => lang.replace('_', '-').toLowerCase()
const isNatural = (v: SpeechSynthesisVoice) => /natural/i.test(v.name)

/**
 * Mejor voz disponible, en este orden: "Jorge" Natural → cualquier es-MX Natural (p. ej. Dalia en Edge) →
 * cualquier es-MX → es-US → cualquier español.
 */
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const mx = voices.filter((v) => norm(v.lang) === 'es-mx')
  return (
    voices.find((v) => /jorge/i.test(v.name) && isNatural(v)) ??
    mx.find(isNatural) ??
    mx[0] ??
    voices.find((v) => norm(v.lang) === 'es-us') ??
    voices.find((v) => norm(v.lang).startsWith('es'))
  )
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

let chosen: SpeechSynthesisVoice | undefined
let lastLogged = ''

/** Elige otra vez entre las voces actuales y lo cuenta en consola (lista de es-* y cuál quedó) solo si algo cambió. */
function choose(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  chosen = pickVoice(voices)
  const spanish = voices.filter((v) => norm(v.lang).startsWith('es'))
  const line = `${spanish.map((v) => `${v.name} (${v.lang})`).join(' | ')} => ${chosen ? `${chosen.name} (${chosen.lang})` : 'ninguna'}`
  if (line !== lastLogged) {
    lastLogged = line
    console.info(`[voz] voces es-*: ${spanish.length ? spanish.map((v) => `${v.name} (${v.lang})`).join(' | ') : 'ninguna'}`)
    console.info(`[voz] elegida: ${chosen ? `${chosen.name} (${chosen.lang})` : 'ninguna (se usa la del navegador)'}`)
  }
  return chosen
}

/**
 * Voz de /pantalla con speechSynthesis (gratis, sin servidor). `speak` devuelve una promesa que se cumple
 * cuando termina de hablar (o falla, o se agota el tope): quien la espera nunca se queda colgado.
 * Los textos se encolan solos, así que nunca se encimarán. `speaking` sirve para bajar el volumen de la música.
 * Las voces "Online (Natural)" de Edge cargan tarde: se vuelve a elegir en cada voiceschanged y antes de cada
 * frase si todavía no hay una Natural. Se asignan `voice` y `lang` de la voz elegida para que el navegador no use otra.
 * Chrome exige una interacción previa con la página: si bloquea la voz, `blocked` pasa a true y `unlock` (desde un clic) la activa.
 * Sin soporte de voz, solo se espera lo que tardaría en leerse (el texto también se muestra en pantalla).
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
      const v = choose(synth.getVoices())
      setVoiceName(v ? v.name : null)
    }
    synth.addEventListener('voiceschanged', refresh)
    const first = setTimeout(refresh, 0)
    return () => {
      synth.removeEventListener('voiceschanged', refresh)
      clearTimeout(first)
    }
  }, [])

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      pending.current += 1
      setSpeaking(true)
      let done = false
      // Tope: lo que tardaría en leerse, contando lo que ya está en cola (más la espera de las voces).
      const cap = setTimeout(() => finish(), readingMs(text) * Math.max(1, pending.current) + VOICES_WAIT_MS)
      function finish() {
        if (done) return
        done = true
        clearTimeout(cap)
        pending.current -= 1
        if (pending.current <= 0) setSpeaking(false)
        resolve()
      }
      if (!('speechSynthesis' in window)) return
      void loadVoices().then((voices) => {
        if (done) return
        // Si todavía no hay una Natural, se vuelve a elegir con lo que haya justo ahora.
        const voice = chosen && isNatural(chosen) ? chosen : choose(voices)
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.95
        utterance.pitch = 1.0
        if (voice) {
          utterance.voice = voice
          utterance.lang = voice.lang // si solo se pone lang, el navegador puede escoger otra voz
        } else {
          utterance.lang = 'es-MX'
        }
        utterance.onend = finish
        utterance.onerror = (e) => {
          if (e.error === 'not-allowed') setBlocked(true)
          finish()
        }
        window.speechSynthesis.speak(utterance)
      })
    })
  }, [])

  const unlock = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    setBlocked(false)
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(' ')) // el clic habilita la voz para el resto de la sesión
  }, [])

  return { speak, speaking, blocked, unlock, voiceName }
}
