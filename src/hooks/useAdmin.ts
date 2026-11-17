import { useEffect, useState } from 'react'
import { useAdminSession } from './useAdminSession'
import { useAdminAnnouncements } from './useAdminAnnouncements'
import { useAdminBackup } from './useAdminBackup'
import { useAdminEvents } from './useAdminEvents'
import { useAdminMonitor } from './useAdminMonitor'
import { useAdminPlaylists } from './useAdminPlaylists'
import { useAdminRules } from './useAdminRules'
import { useAdminSettings } from './useAdminSettings'
import { useAdminSimulator } from './useAdminSimulator'
import { useAdminSongs } from './useAdminSongs'
import { useSpeech } from './useSpeech'

export type AdminTab = 'monitor' | 'canciones' | 'playlists' | 'reglas' | 'eventos' | 'anuncios' | 'contexto' | 'config'

export const ADMIN_TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'monitor', label: 'Monitor' },
  { id: 'canciones', label: 'Canciones' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'reglas', label: 'Reglas' },
  { id: 'eventos', label: 'Eventos y temas' },
  { id: 'anuncios', label: 'Anuncios' },
  { id: 'contexto', label: 'Simular contexto' },
  { id: 'config', label: 'Configuración' },
]

/**
 * Hook principal de /admin: sesión (solo cuentas de la tabla admins), pestaña activa y los datos de cada sección.
 * Cada sección vive en su propio hook y solo carga cuando ya hay un admin dentro.
 */
export function useAdmin() {
  const auth = useAdminSession()
  const [tab, setTab] = useState<AdminTab>('monitor')
  const enabled = auth.isAdmin
  const settings = useAdminSettings(enabled)
  const songs = useAdminSongs(enabled)
  const events = useAdminEvents(enabled, songs.themeCounts)
  const rules = useAdminRules(enabled)
  const backup = useAdminBackup()
  const playlists = useAdminPlaylists(enabled, songs.all)
  const simulator = useAdminSimulator(enabled)
  const monitor = useAdminMonitor(enabled && tab === 'monitor')
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
    rules,
    backup,
    playlists,
    announcements,
    simulator,
    monitor,
    nowMs,
  }
}

export type AdminModel = ReturnType<typeof useAdmin>
