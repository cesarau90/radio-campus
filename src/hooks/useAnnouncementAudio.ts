import { useCallback, useEffect, useRef, useState } from 'react'

/** Segundos extra sobre la duración del MP3 antes de cortarlo (para que nunca se quede trabado). */
const GRACE_SEC = 5
/** Si el MP3 no empieza a sonar en este tiempo, se da por fallido y se usa la voz. */
const START_TIMEOUT_MS = 10_000
/** Para los clips de voz pregrabada: si no arrancan en 3 s, entra la voz del navegador. */
export const CLIP_START_TIMEOUT_MS = 3_000

/**
 * Reproduce el MP3 de un anuncio. `play` devuelve true si sonó completo (o se cortó por el límite de seguridad)
 * y false si no pudo sonar (404, formato, autoplay bloqueado): ahí quien llama usa la voz del navegador.
 * `playing` sirve para bajar el volumen de la música mientras habla. `unlock` se llama desde "Activar sonido".
 */
export function useAnnouncementAudio() {
  const [playing, setPlaying] = useState(false)
  const el = useRef<HTMLAudioElement | null>(null)
  const stop = useRef<(() => void) | null>(null)

  const audio = useCallback(() => (el.current ??= new Audio()), [])

  const unlock = useCallback(() => {
    // Un clic del usuario "bendice" este elemento para reproducir luego sin interacción.
    const a = audio()
    a.muted = true
    a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
    void a.play().then(() => a.pause()).catch(() => {}).finally(() => { a.muted = false })
  }, [audio])

  const play = useCallback(
    (url: string, startTimeoutMs: number = START_TIMEOUT_MS): Promise<boolean> =>
      new Promise((resolve) => {
        const a = audio()
        let started = false
        let timer = window.setTimeout(() => finish(false), startTimeoutMs)
        function finish(ok: boolean) {
          window.clearTimeout(timer)
          a.onended = a.onerror = a.onplaying = a.onloadedmetadata = null
          a.pause()
          setPlaying(false)
          stop.current = null
          resolve(ok)
        }
        stop.current = () => finish(started)
        a.muted = false
        a.onerror = () => finish(false)
        a.onended = () => finish(true)
        a.onplaying = () => {
          started = true
          setPlaying(true)
        }
        a.onloadedmetadata = () => {
          // Tope de seguridad: duración + 5 s
          window.clearTimeout(timer)
          const sec = Number.isFinite(a.duration) ? a.duration : 60
          timer = window.setTimeout(() => finish(started), (sec + GRACE_SEC) * 1000)
        }
        a.src = url
        a.play().catch(() => finish(false))
      }),
    [audio],
  )

  useEffect(() => () => stop.current?.(), [])

  return { play, playing, unlock }
}
