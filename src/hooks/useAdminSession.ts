import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { fetchIsAdmin } from '../lib/api'

/**
 * Sesión del panel /admin (correo y contraseña). NO inicia sesión anónima.
 * Que el usuario sea admin lo decide la base de datos (tabla admins, función is_admin()):
 * una cuenta válida que no esté en admins entra al login pero no al panel.
 */
export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (s: Session | null): Promise<boolean> => {
    if (!s || s.user.is_anonymous) {
      setIsAdmin(false)
      return false
    }
    try {
      const ok = await fetchIsAdmin()
      setIsAdmin(ok)
      return ok
    } catch {
      setIsAdmin(false)
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      setSession(data.session)
      await verify(data.session)
      if (!cancelled) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      // No se llama a Supabase dentro del callback (puede bloquear el cliente): se difiere.
      setTimeout(() => void verify(s), 0)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [verify])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null)
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err || !data.session) {
        setError('Correo o contraseña incorrectos.')
        return false
      }
      const ok = await verify(data.session)
      if (!ok) {
        await supabase.auth.signOut()
        setError('Esta cuenta no tiene permisos de administrador.')
        return false
      }
      return true
    },
    [verify],
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setIsAdmin(false)
  }, [])

  return { session, email: session?.user.email ?? null, isAdmin, loading, error, login, logout }
}
