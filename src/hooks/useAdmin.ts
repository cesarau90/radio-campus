import { useEffect, useState } from 'react'
import { useAdminSession } from './useAdminSession'
import { useAdminAnnouncements } from './useAdminAnnouncements'
import { useAdminEvents } from './useAdminEvents'
import { useAdminSettings } from './useAdminSettings'
import { useAdminSongs } from './useAdminSongs'
import { useSpeech } from './useSpeech'

export type AdminTab = 'canciones' | 'eventos' | 'anuncios' | 'config'

export const ADMIN_TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'canciones', label: 'Canciones' },
  { id: 'eventos', label: 'Eventos y temas' },
  { id: 'anuncios', label: 'Anuncios' },
  { id: 'config', label: 'Configuración' },
]

/**
 * Hook principal de /admin: sesión (solo cuentas de la tabla admins), pestaña activa y los datos de cada sección.
 * Cada sección vive en su propio hook y solo carga cuando ya hay un admin dentro.
 */
export function useAdmin() {
  const auth = useAdminSession()
  const [tab, setTab] = useState<AdminTab>('canciones')
  const enabled = auth.isAdmin
  const settings = useAdminSettings(enabled)
  const songs = useAdminSongs(enabled)
  const events = useAdminEvents(enabled, songs.themeCounts)
  const speech = useSpeech() // para probar la voz de los anuncios
  const announcements = useAdminAnnouncements(enabled, speech.speak)

  // Hora actual para marcar eventos vigentes / próximos; se refresca cada minuto.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  return {
    loading: auth.loading,
    isAdmin: auth.isAdmin,
    email: auth.email,
    loginError: auth.error,
    login: auth.login,
    logout: auth.logout,
    tab,
    setTab,
    settings,
    songs,
    events,
    announcements,
    nowMs,
  }
}

export type AdminModel = ReturnType<typeof useAdmin>
