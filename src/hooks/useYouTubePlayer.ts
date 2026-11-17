import { useCallback, useEffect, useRef, useState } from 'react'
import { loadYouTubeApi } from '../lib/youtubeApi'
import { YT_ENDED, YT_PAUSED, YT_PLAYING, type YTPlayer } from '../types/youtube'

const FADE_MS = 3000 // el volumen baja a 0 en los últimos 3 s de la canción
const BLOCKED_AFTER_MS = 4000 // si no suena a los 4 s, el navegador bloqueó el audio automático
const TICK_MS = 250
const DUCK_VOLUME = 25 // mientras habla la voz, la música baja a este volumen

/** Quita los subtítulos de YouTube (en una TV de pasillo estorban). Si el módulo no está cargado, no pasa nada. */
function hideCaptions(player: YTPlayer) {
  try {
    player.unloadModule('captions')
  } catch {
    /* sin subtítulos que quitar */
  }
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'blocked'

interface Params {
  /** ID de YouTube de la canción en curso; null = nada que reproducir. */
  videoId: string | null
  /** Cuándo empezó y cuándo debe terminar (hora del servidor, ISO). Con eso se retoma a media canción al recargar. */
  startedAt: string | null
  endsAt: string | null
  nowMs: () => number
  /** El reloj del servidor y los datos ya están listos. */
  ready: boolean
  paused: boolean
  /** La voz está hablando: se baja el volumen de la música. */
  duck: boolean
  /** Código de error de YouTube (2, 5, 100, 101, 150…): el video no existe o no se puede incrustar. */
  onError: (code: number) => void
}

/**
 * Reproductor de YouTube de /pantalla. El servidor manda en los tiempos: arranca en `now − startedAt`,
 * baja el volumen en los últimos 3 s y corta en `endsAt`. Si el navegador bloquea el audio automático,
 * `status` pasa a 'blocked' y `unlock` (desde un clic) lo activa.
 * Devuelve `wrapRef` (callback ref): el reproductor se crea dentro de ese elemento.
 */
export function useYouTubePlayer({ videoId, startedAt, endsAt, nowMs, ready, paused, duck, onError }: Params) {
  const [wrapEl, setWrapEl] = useState<HTMLElement | null>(null)
  const [player, setPlayer] = useState<YTPlayer | null>(null)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [apiError, setApiError] = useState<string | null>(null)
  const onErrorRef = useRef(onError)
  const nowRef = useRef(nowMs)
  const endsAtRef = useRef(endsAt)
  const pausedRef = useRef(paused)
  const duckRef = useRef(duck)
  useEffect(() => {
    onErrorRef.current = onError
    nowRef.current = nowMs
    endsAtRef.current = endsAt
    pausedRef.current = paused
    duckRef.current = duck
  })

  // Crear el reproductor dentro del contenedor (un div hijo, porque la API reemplaza el nodo por un iframe).
  useEffect(() => {
    if (!wrapEl) return
    let cancelled = false
    let created: YTPlayer | null = null
    const target = document.createElement('div')
    wrapEl.appendChild(target)
    loadYouTubeApi().then(
      (YT) => {
        if (cancelled) return
        created = new YT.Player(target, {
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            iv_load_policy: 3,
            cc_load_policy: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              hideCaptions(e.target)
              if (!cancelled) setPlayer(e.target)
            },
            onStateChange: (e) => {
              if (e.data === YT_PLAYING) {
                hideCaptions(e.target) // si aun así salieron subtítulos, se quitan
                setStatus('playing')
              } else if (e.data === YT_ENDED) {
                setStatus('idle')
              } else if (e.data === YT_PAUSED) {
                // En pausa YouTube pinta su interfaz (título, "Más videos"): se oculta el video y se ve la portada.
                setStatus('idle')
                // Si se pausó sola (p. ej. el navegador) antes de que acabe la canción, se reanuda.
                if (!pausedRef.current && endsAtRef.current && new Date(endsAtRef.current).getTime() - nowRef.current() > 1000) {
                  e.target.playVideo()
                }
              }
            },
            onError: (e) => onErrorRef.current(e.data),
          },
        })
      },
      (e: Error) => {
        if (!cancelled) setApiError(e.message)
      },
    )
    return () => {
      cancelled = true
      setPlayer(null)
      created?.destroy()
      target.remove()
    }
  }, [wrapEl])

  // Cargar la canción: al cambiar de canción, al salir de la pausa y al terminar de cargar el reproductor.
  useEffect(() => {
    if (!player || !ready || paused || !videoId || !startedAt || !endsAt) return
    const elapsed = (nowRef.current() - new Date(startedAt).getTime()) / 1000
    const left = new Date(endsAt).getTime() - nowRef.current()
    if (left <= 0) return
    player.setVolume(100)
    player.loadVideoById({ videoId, startSeconds: Math.max(0, elapsed) })
    const loadingTimer = setTimeout(() => setStatus('loading'), 0)
    const blockedTimer = setTimeout(() => {
      if (player.getPlayerState() !== YT_PLAYING) setStatus('blocked')
    }, BLOCKED_AFTER_MS)
    return () => {
      clearTimeout(loadingTimer)
      clearTimeout(blockedTimer)
    }
  }, [player, ready, paused, videoId, startedAt, endsAt])

  // Pausa de la radio.
  useEffect(() => {
    if (player && paused) player.pauseVideo()
  }, [player, paused])

  // Fade-out en los últimos segundos y corte exacto al terminar.
  useEffect(() => {
    if (!player || !endsAt || paused) return
    const end = new Date(endsAt).getTime()
    let lastVolume = -1
    const id = setInterval(() => {
      const remaining = end - nowRef.current()
      if (remaining <= 0) {
        player.pauseVideo()
        return
      }
      const base = duckRef.current ? DUCK_VOLUME : 100
      const fade = remaining <= FADE_MS ? Math.round((100 * remaining) / FADE_MS) : 100
      const volume = Math.min(base, fade)
      if (volume !== lastVolume) {
        lastVolume = volume
        player.setVolume(volume)
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [player, endsAt, paused])

  const unlock = useCallback(() => {
    player?.playVideo()
  }, [player])

  return { wrapRef: setWrapEl, status, unlock, apiError }
}
