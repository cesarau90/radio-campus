import { useMemo } from 'react'
import { useAnonymousSession } from './useAnonymousSession'
import { useServerClock } from './useServerClock'
import { useLiveState } from './useLiveState'
import { useCountdown } from './useCountdown'

/** Hook principal de /diagnostico (solo desarrollo): junta los hooks base para probarlos en el navegador. */
export function useDiagnostico() {
  const session = useAnonymousSession()
  const clock = useServerClock(session.ready)
  const live = useLiveState(session.ready)

  // Cuenta regresiva de prueba: 20 s desde la hora del servidor, para ver que useCountdown baja.
  const { ready: clockReady, nowMs } = clock
  const demoEndsAt = useMemo(
    () => (clockReady ? new Date(nowMs() + 20_000).toISOString() : null),
    [clockReady, nowMs],
  )
  const countdown = useCountdown(demoEndsAt, clock.nowMs, clock.ready)

  return {
    session: { userId: session.userId, ready: session.ready, error: session.error },
    clock: { ready: clock.ready, offsetMs: clock.offsetMs, rttMs: clock.rttMs },
    countdown: { remainingSec: countdown.remainingSec, expired: countdown.expired },
    live: {
      connection: live.connection,
      loading: live.loading,
      error: live.error,
      paused: live.settings?.paused ?? null,
      lat: live.settings?.lat ?? null,
      lon: live.settings?.lon ?? null,
      phase: live.playback?.phase ?? null,
      songsLoaded: Object.keys(live.songs).length,
      hasRound: live.round !== null,
      announcements: live.announcements.length,
    },
  }
}
