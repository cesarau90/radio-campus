import { loadYouTubeApi } from './youtubeApi'

/** Saca el ID de 11 caracteres de un enlace de YouTube (watch, youtu.be, embed, shorts) o de un ID suelto. null si no parece uno. */
export function extractVideoId(input: string): string | null {
  const text = input.trim()
  if (/^[\w-]{11}$/.test(text)) return text
  const m = text.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})(?![\w-])/)
  return m ? m[1] : null
}

export interface OEmbedInfo {
  title: string
  author: string
}

/**
 * Comprueba con oEmbed que el video existe y se puede incrustar (HTTP 200) y devuelve su título y canal.
 * 401/403/404 = privado, borrado o sin permiso de incrustar.
 */
export async function fetchOEmbed(videoId: string): Promise<OEmbedInfo> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
  const res = await fetch(url)
  if (res.status === 404) throw new Error('Ese video no existe o es privado.')
  if (res.status === 401 || res.status === 403) throw new Error('Ese video no permite reproducirse fuera de YouTube.')
  if (!res.ok) throw new Error(`YouTube respondió ${res.status}. Inténtalo otra vez.`)
  const data = (await res.json()) as { title?: string; author_name?: string }
  return { title: data.title ?? '', author: data.author_name ?? '' }
}

/** "Avicii - Topic", "AviciiVEVO" → "Avicii", "AviciiOfficialVEVO" → "AviciiOfficial": quita los sufijos de canal más comunes. */
export function cleanAuthor(author: string): string {
  return author.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim()
}

/**
 * Duración en segundos con un reproductor de YouTube oculto (oEmbed no la da): se espera a que cargue los metadatos.
 * Lanza error si el reproductor falla o si no hay duración en `timeoutMs`.
 */
export async function fetchDuration(videoId: string, timeoutMs = 10_000): Promise<number> {
  const YT = await loadYouTubeApi()
  return new Promise<number>((resolve, reject) => {
    const host = document.createElement('div')
    // Fuera de la vista pero con tamaño real: YouTube pide un mínimo de 200×200 para reproducir.
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:200px;pointer-events:none;'
    const target = document.createElement('div')
    host.appendChild(target)
    document.body.appendChild(host)

    let finished = false
    let timer: ReturnType<typeof setInterval>
    let player: InstanceType<typeof YT.Player>
    const finish = (fn: () => void) => {
      if (finished) return
      finished = true
      clearInterval(timer)
      clearTimeout(limit)
      try {
        player?.destroy()
      } catch {
        /* ya estaba destruido */
      }
      host.remove()
      fn()
    }
    const limit = setTimeout(() => finish(() => reject(new Error('No se pudo leer la duración del video.'))), timeoutMs)

    player = new YT.Player(target, {
      width: 200,
      height: 200,
      videoId,
      playerVars: { controls: 0, playsinline: 1, origin: window.location.origin },
      events: {
        onReady: () => {
          timer = setInterval(() => {
            const d = player.getDuration()
            if (d > 0) finish(() => resolve(Math.round(d)))
          }, 250)
        },
        onError: () => finish(() => reject(new Error('YouTube no pudo cargar ese video.'))),
      },
    })
  })
}
