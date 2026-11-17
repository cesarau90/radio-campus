import './admin.css'
import { ADMIN_TABS, type AdminModel } from '../hooks/useAdmin'
import AdminLogin from './AdminLogin'
import AnnouncementsPanel from './AnnouncementsPanel'
import EventsPanel from './EventsPanel'
import { DialMark } from './icons'
import MonitorPanel from './MonitorPanel'
import SettingsForm from './SettingsForm'
import SimulatorPanel from './SimulatorPanel'
import SongsPanel from './SongsPanel'
import StatusNotice from './StatusNotice'

/** Pantalla completa de /admin. Solo pinta el modelo que arma useAdmin; no tiene lógica propia. */
export default function AdminView(m: AdminModel) {
  if (m.loading) {
    return (
      <div className="ad-app">
        <StatusNotice scanning title="Sintonizando…" text="Revisando tu sesión." />
      </div>
    )
  }
  if (!m.isAdmin) {
    return (
      <div className="ad-app">
        <AdminLogin error={m.loginError} onLogin={m.login} />
      </div>
    )
  }

  return (
    <div className="ad-app">
      <header className="ad-top">
        <span className="ad-brand">
          <DialMark size={28} />
          Radio Campus · Admin
        </span>
        <span className="ad-user">
          <span className="ad-hint mono">{m.email}</span>
          <button type="button" className="ad-btn" onClick={() => void m.logout()}>
            Salir
          </button>
        </span>
      </header>

      <nav className="ad-tabs" aria-label="Secciones">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="ad-tab"
            aria-current={m.tab === t.id ? 'page' : undefined}
            onClick={() => m.setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="ad-main">
        {m.tab === 'monitor' && <MonitorPanel monitor={m.monitor} />}
        {m.tab === 'canciones' && <SongsPanel songs={m.songs} />}
        {m.tab === 'contexto' && <SimulatorPanel sim={m.simulator} />}
        {m.tab === 'config' && <SettingsForm settings={m.settings} />}
        {m.tab === 'eventos' && <EventsPanel events={m.events} themes={m.songs.suggestions.themes} nowMs={m.nowMs} />}
        {m.tab === 'anuncios' && <AnnouncementsPanel announcements={m.announcements} nowMs={m.nowMs} />}
      </main>
    </div>
  )
}
