import type { YTNamespace } from '../types/youtube'

let loading: Promise<YTNamespace> | null = null

/** Carga la YouTube IFrame API una sola vez y devuelve su espacio de nombres. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (loading) return loading
  loading = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
      else reject(new Error('La API de YouTube no quedó disponible.'))
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      loading = null
      reject(new Error('No se pudo cargar el reproductor de YouTube. Revisa la conexión.'))
    }
    document.head.appendChild(script)
  })
  return loading
}
