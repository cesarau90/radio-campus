/** Lo mínimo de la YouTube IFrame API que usa /pantalla. */
export interface YTPlayer {
  loadVideoById(options: { videoId: string; startSeconds?: number }): void
  playVideo(): void
  pauseVideo(): void
  setVolume(volume: number): void
  unloadModule(name: string): void
  getPlayerState(): number
  getDuration(): number
  destroy(): void
}

export interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      width?: string | number
      height?: string | number
      videoId?: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (e: { target: YTPlayer }) => void
        onStateChange?: (e: { data: number; target: YTPlayer }) => void
        onError?: (e: { data: number; target: YTPlayer }) => void
      }
    },
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

/** Estados de getPlayerState / onStateChange. */
export const YT_ENDED = 0
export const YT_PLAYING = 1
export const YT_PAUSED = 2
