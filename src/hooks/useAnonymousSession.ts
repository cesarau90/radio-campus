import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createAnonymousSession } from '../lib/session'

interface SessionState {
  userId: string | null
  ready: boolean
  error: string | null
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/no la pudo conservar/i.test(msg)) {
    return 'Este navegador no deja guardar tu sesión (¿modo privado o almacenamiento bloqueado?). Desactívalo para esta página e inténtalo otra vez.'
  }
  if (/anonymous sign-ins are disabled/i.test(msg)) {
    return 'Los inicios de sesión anónimos están desactivados en Supabase (Authentication > Sign In / Providers).'
  }
  return msg
}

/**
 * Garantiza una sesión de Supabase para votantes y para la pantalla.
 * Reutiliza la sesión guardada; si no hay, inicia sesión anónima (una por navegador, así
 * funciona "1 voto por usuario" sin registrarse). NO se usa en /admin.
 */
export function useAnonymousSession() {
  const [state, setState] = useState<SessionState>({ userId: null, ready: false, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (session) {
        setState({ userId: session.user.id, ready: true, error: null })
      } else if (event === 'SIGNED_OUT') {
        // La sesión se perdió (token vencido, otra pestaña cerró sesión): se vuelve a crear.
        setState({ userId: null, ready: false, error: null })
        setAttempt((a) => a + 1)
      }
    })

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          if (!cancelled) setState({ userId: data.session.user.id, ready: true, error: null })
          return
        }
        // Crea la sesión y confirma con getSession() que quedó guardada: hasta entonces la pantalla no deja votar.
        await createAnonymousSession()
        const { data: confirmed } = await supabase.auth.getSession()
        if (!cancelled) setState({ userId: confirmed.session?.user.id ?? null, ready: true, error: null })
      } catch (e) {
        if (!cancelled) setState({ userId: null, ready: false, error: friendlyError(e) })
      }
    })()

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
    setAttempt((a) => a + 1)
  }, [])

  return { ...state, retry }
}
